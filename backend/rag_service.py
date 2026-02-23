"""
RAG service — orchestrates the full Retrieval-Augmented Generation pipeline.

1. Embed the user query
2. Search Azure SQL for similar legal texts
3. Build an augmented prompt with retrieved context
4. Call Azure OpenAI gpt-4o-mini for the final answer
"""
from typing import List, Dict, Any, Generator
import json
import re
from openai import AzureOpenAI

from config import (
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_API_VERSION,
    AZURE_OPENAI_CHAT_DEPLOYMENT,
    TOP_K_RESULTS,
)
from embedding_service import get_embedding
from vector_store import search_similar

_chat_client: AzureOpenAI | None = None


def _get_chat_client() -> AzureOpenAI:
    global _chat_client
    if _chat_client is None:
        _chat_client = AzureOpenAI(
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
        )
    return _chat_client


# ── System prompt for the legal chatbot ───────────────────────
SYSTEM_PROMPT = """أنت "المستشار القانوني"، مساعد ذكي متخصص في القانون المغربي. هدفك تقديم إجابات دقيقة، عملية، ومبسطة بناءً على النصوص القانونية.

## المبادئ التوجيهية للرد على الأسئلة القانونية:
1. **كن مباشراً وعملياً**:
   - لا تبدأ بعبارات سلبية مثل "لا يمكنني" أو "لا يوجد نص".
   - إذا لم تجد نصاً صريحاً، قدم **إرشادات عامة** أو **المبادئ المعمول بها** في مثل هذه الحالات، مع التنبيه بضرورة استشارة محامٍ.

2. **الصياغة والأسلوب**:
   - استخدم **اللغة العربية الفصحى** الرصينة والواضحة (تجنب الدارجة في الردود إلا إذا اقتضى التوضيح).
   - كن مهنياً ولكن ودوداً (مساعد، ناصح، وليس مجرد محرك بحث).

3. **هيكلة الإجابة**:
   - **الخلاصة**: ابدأ بإجابة مباشرة ومختصرة على سؤال المستخدم.
   - **التفاصيل القانونية**: اشرح المقتضيات القانونية بأسلوب سلس.
   - **المراجع**: استشهد بالنصوص (الفصل X من قانون Y) دون تكرار القائمة الكاملة للنصوص إذا كانت كثيرة.
   - **خطوات عملية**: اقترح الخطوة التالية للمستخدم (مثلاً: "يمكنك التوجه إلى محكمة الأسرة..." أو "عليك توثيق العقد...").

4. **التعامل مع النصوص**:
   - استعمل المعلومات الموجودة في "السياق القانوني" أدناه.
   - لا تختلق نصوصاً قانونية غير موجودة (هلوسة = ممنوع).
   - إذا كان السؤال خارجاً عن السياق القانوني تماماً، وجه المستخدم بلطف إلى المجال المناسب.

5. **التعامل مع التحيات والأسئلة العامة**:
   - إذا كان السياق القانوني فارغاً أو عبارة عن "لا توجد نصوص"، وكان الإدخال تحية، فرد بترحيب مهني قصير.
   - إذا كان السؤال قانونياً، يجب عليك استخراج الجواب من السياق القانوني بوضوح.

6. **تنسيق الرد**:
   - استخدم العوارض (Bullet points) لتبسيط التعدادات.
   - استخدم الخط العريض (**Bold**) للكلمات المفتاحية.
"""

def _is_greeting(query: str) -> bool:
    """Heuristic check to see if the user's input is just a simple greeting."""
    query = query.strip().lower()
    # Remove punctuation
    query = re.sub(r'[^\w\s]', '', query)
    greetings = {"salam", "سلام", "مرحبا", "bonjour", "hello", "hi", "اهلا", "أهلا", "salut", "hey", "كيف حالك"}
    words = query.split()
    if not words: return False
    # If it's a short message and contains a greeting word, consider it a greeting
    return len(words) <= 4 and any(w in greetings for w in words)


def _build_context(results: List[Dict[str, Any]]) -> str:
    """Format retrieved legal texts into a context block for the LLM."""
    if not results:
        return "لا توجد نصوص قانونية ذات صلة."

    context_parts = []
    for i, r in enumerate(results, 1):
        context_parts.append(
            f"[{i}] القانون: {r['domain']}\n"
            f"    المرجع: {r['reference']}\n"
            f"    النص: {r['content']}\n"
        )
    return "\n".join(context_parts)


def answer_question(query: str, top_k: int = TOP_K_RESULTS) -> Dict[str, Any]:
    """
    Full RAG pipeline: query → embed → search → LLM → answer.
    Returns dict with 'response' and 'sources'.
    """
    if _is_greeting(query):
        results = []
    else:
        # 1. Embed the query
        query_embedding = get_embedding(query)
        # 2. Retrieve similar legal texts from Azure SQL
        results = search_similar(query_embedding, top_k=top_k)

    # 3. Build augmented prompt
    context = _build_context(results)

    user_prompt = f"""## السياق القانوني:
{context}

## سؤال المستخدم:
{query}

إذا كان السياق يحتوي على نصوص قانونية، أجب بالتفصيل بناءً عليها فقط وبشكل مباشر لسؤال المستخدم.
وإذا كان السياق فارغاً وكان السؤال عبارة عن تحية، فرد التحية بمهنية وبلطف."""

    # 4. Call Azure OpenAI
    client = _get_chat_client()
    completion = client.chat.completions.create(
        model=AZURE_OPENAI_CHAT_DEPLOYMENT,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,  # Low temperature for factual answers
        max_tokens=2000,
    )

    answer = completion.choices[0].message.content

    # 5. Format sources for the frontend
    sources = [
        {
            "domain": r["domain"],
            "reference": r["reference"],
            "score": r["score"],
        }
        for r in results
    ]

    return {
        "response": answer,
        "sources": sources,
    }


def answer_question_stream(query: str, top_k: int = TOP_K_RESULTS):
    """
    Generator that streams the answer for SSE (Server-Sent Events).
    Yields JSON strings:
    - First yield: {"type": "sources", "data": [...]}
    - Subsequent yields: {"type": "content", "data": "token"}
    """
    if _is_greeting(query):
        results = []
    else:
        # 1. Embed and Retrieve
        query_embedding = get_embedding(query)
        results = search_similar(query_embedding, top_k=top_k)

    # 2. Yield Sources immediately
    sources = [
        {"domain": r["domain"], "reference": r["reference"], "score": r["score"]}
        for r in results
    ]
    yield json.dumps({"type": "sources", "data": sources}) + "\n"

    # 3. Build Context & Prompt
    context = _build_context(results)
    user_prompt = f"""## السياق القانوني:
{context}

## سؤال المستخدم:
{query}

إذا كان السياق يحتوي على نصوص قانونية، أجب بالتفصيل بناءً عليها فقط وبشكل مباشر لسؤال المستخدم.
وإذا كان السياق فارغاً وكان السؤال عبارة عن تحية، فرد التحية بمهنية وبلطف."""

    # 4. Stream from Azure OpenAI
    client = _get_chat_client()
    stream = client.chat.completions.create(
        model=AZURE_OPENAI_CHAT_DEPLOYMENT,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,
        max_tokens=2000,
        stream=True,  # Enable streaming
    )

    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            # Yield content chunk
            yield json.dumps({"type": "content", "data": content}) + "\n"
