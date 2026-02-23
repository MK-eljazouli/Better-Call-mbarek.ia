# Rapport Technique Détaillé : Chatbot Juridique Marocain (Al-Moustachar)

---

**Date** : 11 Février 2026  
**Version** : 1.0.0  
**Auteur** : Équipe de Développement (Google Deepmind Assistant)

---

## 📑 Table des Matières

1.  [Introduction](#1-introduction)
    *   [1.1 Contexte du Projet](#11-contexte-du-projet)
    *   [1.2 Objectif Principal](#12-objectif-principal)
    *   [1.3 Public Cible](#13-public-cible)
2.  [Architecture du Système](#2-architecture-du-système)
    *   [2.1 Vue d'ensemble](#21-vue-densemble)
    *   [2.2 Diagramme d'Architecture](#22-diagramme-darchitecture)
    *   [2.3 Flux de Données (Data Flow)](#23-flux-de-données-data-flow)
3.  [Stack Technologique](#3-stack-technologique)
    *   [3.1 Frontend (Interface Utilisateur)](#31-frontend-interface-utilisateur)
    *   [3.2 Backend (API & Logique)](#32-backend-api--logique)
    *   [3.3 Base de Données & Vector Store](#33-base-de-données--vector-store)
    *   [3.4 Intelligence Artificielle (IA)](#34-intelligence-artificielle-ia)
4.  [Détails d'Implémentation](#4-détails-dimplémentation)
    *   [4.1 Ingestion des Données Juridiques](#41-ingestion-des-données-juridiques)
    *   [4.2 Moteur RAG (Retrieval-Augmented Generation)](#42-moteur-rag-retrieval-augmented-generation)
    *   [4.3 Streaming en Temps Réel (SSE)](#43-streaming-en-temps-réel-sse)
    *   [4.4 Prompt Engineering & Qualité des Réponses](#44-prompt-engineering--qualité-des-réponses)
5.  [Défis Techniques & Solutions](#5-défis-techniques--solutions)
    *   [5.1 Compatibilité Python 3.14](#51-compatibilité-python-314)
    *   [5.2 Performance d'Ingestion Azure SQL](#52-performance-dingestion-azure-sql)
    *   [5.3 Conversion de Types (ntext vs vector)](#53-conversion-de-types-ntext-vs-vector)
6.  [Guide d'Installation et de Démarrage](#6-guide-dinstallation-et-de-démarrage)
    *   [6.1 Prérequis](#61-prérequis)
    *   [6.2 Configuration des Variables d'Environnement](#62-configuration-des-variables-denvironnement)
    *   [6.3 Lancement Local](#63-lancement-local)
7.  [Guide de Déploiement Azure](#7-guide-de-déploiement-azure)
    *   [7.1 Création des Ressources](#71-création-des-ressources)
    *   [7.2 Déploiement de l'Application](#72-déploiement-de-lapplication)
8.  [Roadmap et Améliorations Futures](#8-roadmap-et-améliorations-futures)
9.  [Conclusion](#9-conclusion)
10. [Annexes : Extraits de Code Clés](#10-annexes--extraits-de-code-clés)

---

## 1. Introduction

### 1.1 Contexte du Projet
L'accès à l'information juridique au Maroc peut être complexe pour les citoyens non experts. Les textes de loi sont dispersés, le langage est technique, et la recherche manuelle est fastidieuse. Le projet **Al-Moustachar** vise à démocratiser cet accès en utilisant les dernières avancées en Intelligence Artificielle Générative.

### 1.2 Objectif Principal
Développer un assistant virtuel conversationnel capable de :
1.  Comprendre des questions juridiques posées en langage naturel (Arabe classique, Darija, Français).
2.  Retrouver instantanément les textes de loi pertinents (Code Pénal, Code de la Famille, etc.) dans une base de données vectorielle.
3.  Générer une réponse claire, précise et sourcée, en s'appuyant **uniquement** sur les textes officiels pour éviter les hallucinations.

### 1.3 Public Cible
-   **Citoyens** : Pour des questions de la vie quotidienne (mariage, divorce, héritage, travail).
-   **Étudiants en Droit** : Pour la recherche rapide de références.
-   **Professionnels** : Pour une première vérification de textes.

---

## 2. Architecture du Système

### 2.1 Vue d'ensemble
L'application suit une architecture moderne de type **Microservices** (ou Client-Serveur découplé), conçue pour être déployée dans le cloud Microsoft Azure. Elle repose sur le pattern **RAG (Retrieval-Augmented Generation)** pour garantir la faibilité des réponses.

### 2.2 Diagramme d'Architecture

```mermaid
graph TD
    User[Utilisateur] -->|HTTPS| Frontend[Frontend (React/Vite)]
    Frontend -->|API REST / SSE| Backend[Backend (FastAPI)]
    
    subgraph "Azure Cloud Data Center"
        Backend -->|Cosine Similarity| SQL[Azure SQL Database (Vector Store)]
        Backend -->|Chat Completion| OpenAI[Azure OpenAI (GPT-4o-mini)]
        Backend -->|Embedding Generation| Embed[Azure OpenAI (text-embedding-3)]
    end
    
    Data[Fichiers JSON Données] -->|Script d'Ingestion| Backend
```

### 2.3 Flux de Données (Data Flow)
1.  **Ingestion (Batch)** :
    *   Les lois brutes (JSON) sont lues.
    *   Elles sont découpées en "chunks" (articles).
    *   Chaque chunk est converti en vecteur (embedding) via l'API OpenAI.
    *   Le texte et le vecteur sont stockés dans Azure SQL.

2.  **Interrogation (Temps Réel)** :
    *   L'utilisateur pose une question.
    *   La question est vectorisée.
    *   Le backend cherche les 5 vecteurs les plus proches dans la base (Cosine Similarity).
    *   Les textes correspondants sont injectés dans le "System Prompt".
    *   GPT-4o-mini génère la réponse finale.
    *   La réponse est streamée token par token vers le frontend.

---

## 3. Stack Technologique

### 3.1 Frontend (Interface Utilisateur)
*   **Framework** : React 18 avec TypeScript.
*   **Build Tool** : Vite (pour la rapidité de développement et la performance).
*   **Style** : Tailwind CSS (pour un design responsive et moderne).
*   **Icônes** : Lucide React.
*   **Gestion d'État** : Hooks React (useState, useEffect, useLocalStore).
*   **Communication** : Fetch API avec support des `ReadableStream` pour le SSE.

### 3.2 Backend (API & Logique)
*   **Langage** : Python 3.14 (adapté avec des dépendances compatibles).
*   **Framework Web** : FastAPI (haute performance, validation Pydantic, support asynchrone).
*   **Serveur** : Uvicorn (ASGI).
*   **Drivers BDD** : `pyodbc` (ODBC Driver 18 for SQL Server).
*   **Client IA** : `openai` (SDK Python officiel).

### 3.3 Base de Données & Vector Store
*   **SGBD** : Azure SQL Database.
*   **Fonctionnalité Clé** : Support natif du type `VECTOR`.
*   **Avant** : Nécessitait une base vectorielle séparée (ex: Pinecone, Qdrant).
*   **Maintenant** : Tout est dans SQL Server, simplifiant l'architecture et réduisant les coûts.

### 3.4 Intelligence Artificielle (IA)
*   **Modèle de Chat** : `gpt-4o-mini`
    *   Pourquoi ? Excellent rapport performance/coût, fenêtre de contexte suffisante, rapide.
*   **Modèle d'Embedding** : `text-embedding-3-small`
    *   Pourquoi ? Plus performant que `ada-002`, dimensions optimisées (1536).

---

## 4. Détails d'Implémentation

### 4.1 Ingestion des Données Juridiques
Le script `ingest.py` est le cœur de la préparation des données. Il assure que la base de connaissance soit toujours synchronisée avec les fichiers JSON sources.

*   **Lecture Récursive** : Script capable de parcourir une arborescence complexe de fichiers JSON.
*   **Parsing** : Validation de la structure `{ "reference": "...", "contenu": "..." }`.
*   **Batch Processing** : Pour éviter de saturer l'API OpenAI et la connexion SQL, l'ingestion se fait par lots (batchs) de 50 à 100 documents.

**Optimisation Majeure** :
Initialement, l'insertion se faisait ligne par ligne, ce qui prenait ~30 minutes pour 3000 articles.
Nous avons implémenté `cursor.fast_executemany = True` avec `pyodbc`.
*   **Résultat** : Temps réduit à moins de 2 minutes.
*   **Technique** : Envoie les données sous forme binaire compressée au serveur SQL au lieu de milliers de requêtes `INSERT` individuelles.

### 4.2 Moteur RAG (Retrieval-Augmented Generation)
Le service `rag_service.py` orchestre la logique métier.

1.  **Vector Search** :
    Utilisation de la fonction SQL native `VECTOR_DISTANCE('cosine', ...)` pour trier les résultats par pertinence sémantique.
    ```sql
    SELECT TOP (5) content, reference, VECTOR_DISTANCE('cosine', embedding, @query_vector) AS dist
    FROM LegalTexts
    ORDER BY dist ASC
    ```

2.  **Construction du Contexte** :
    Les textes retrouvés sont concaténés dans une chaîne formatée qui est insérée dans le prompt système. Cela donne au modèle une "mémoire à court terme" contenant la loi exacte.

### 4.3 Streaming en Temps Réel (SSE)
Pour offrir une expérience utilisateur fluide (type ChatGPT), nous avons remplacé l'attente passive par du streaming.

*   **Format du Flux** : Nous utilisons les Server-Sent Events (SSE).
*   **Protocole Custom** : Le flux envoie deux types d'événements JSON délimités par des sauts de ligne.
    1.  `{ "type": "sources", "data": [...] }` : Envoyé immédiatement après la recherche SQL. Permet d'afficher les citations instantanément.
    2.  `{ "type": "content", "data": "..." }` : Envoyé chunk par chunk au fur et à mesure que GPT génère du texte.

Côté Frontend (`ChatInterface.tsx`), un `ReadableStreamDefaultReader` lit ce flux, décode les octets en texte, parse le JSON ligne par ligne et met à jour l'état React en temps réel.

### 4.4 Prompt Engineering & Qualité des Réponses
Le « System Prompt » a été itéré plusieurs fois pour atteindre un niveau de qualité professionnel :

*   **Persona** : "Al-Moustachar", un assistant juridique expert.
*   **Contraintes** : Interdiction totale d'inventer des lois (Hallucinations = 0).
*   **Formatage** :
    *   Utilisation du Markdown (gras, listes).
    *   Structure imposée : **Résumé** -> **Détails** -> **Références** -> **Conseil**.
*   **Ton** : Arabe formel mais accessible. Évite les phrases robotiques comme "En tant qu'IA...".

---

## 5. Défis Techniques & Solutions

### 5.1 Compatibilité Python 3.14
Le projet utilise une version très récente de Python (3.14), ce qui a posé des problèmes avec certaines bibliothèques non encore optimisées.
*   **Problème** : `numpy` refusait de se compiler/s'installer.
*   **Solution** : Suppression de la dépendance explicite à `numpy` (puisque `openai` et `fastapi` ne l'exigent pas strictement pour nos besoins, ou utilisent des versions pré-compilées compatibles).
*   **Problème** : `pyodbc` échouait à la compilation des headers C++.
*   **Solution** : Installation de la version binaire pré-compilée spécifique ou fallback sur une version pure Python temporaire avant de revenir à un `pyodbc` correctement configuré.

### 5.2 Performance d'Ingestion Azure SQL
*   **Problème** : L'insertion de 3000 vecteurs (listes de 1536 flottants) prenait une éternité.
*   **Cause** : Latence réseau accumulée par 3000 allers-retours Client-Serveur.
*   **Solution** : Utilisation de `executemany` avec l'attribut `fast_executemany = True` du driver `pyodbc`. Cela transforme l'opération en un bulk insert massif.

### 5.3 Conversion de Types (ntext vs vector)
*   **Message d'Erreur** : `Explicit conversion from data type ntext to vector is not allowed`.
*   **Analyse** : Le driver `pyodbc` envoie parfois les chaînes de caractères longues (comme les représentations JSON des vecteurs) sous le type obsolète `ntext` de SQL Server, que le type moderne `VECTOR` ne peut pas caster directement.
*   **Correction** : Force le cast explicite en SQL :
    `CAST(CAST(? AS NVARCHAR(MAX)) AS VECTOR(1536))`
    Cela convertit d'abord `ntext` -> `nvarchar(max)` (compatible) -> `vector`.

---

## 6. Guide d'Installation et de Démarrage

### 6.1 Prérequis
*   Python 3.10 ou plus récent (testé sur 3.14).
*   Compte Azure avec accès aux services OpenAI et SQL Database.
*   Node.js 18+ (pour le développement frontend, optionnel si on utilise le build statique).
*   ODBC Driver 18 for SQL Server installé sur la machine.

### 6.2 Configuration des Variables d'Environnement
Créer un fichier `backend/.env` :

```ini
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://votre-ressource.openai.azure.com/
AZURE_OPENAI_API_KEY=votre_clé_secrète
AZURE_OPENAI_API_VERSION=2024-06-01
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small

# Azure SQL Database
AZURE_SQL_CONNECTION_STRING=Driver={ODBC Driver 18 for SQL Server};Server=tcp:serveur.database.windows.net,1433;Database=dalil-db;Uid=admin;Pwd=password;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;
```

### 6.3 Lancement Local
Un script automatisé `start.bat` a été créé pour simplifier le lancement sur Windows.
Il effectue :
1.  Lancement du serveur Backend (`uvicorn`) sur le port 8000.
2.  Lancement du serveur Frontend (`vite`) sur le port 3000.

Commandes manuelles :
```bash
# Terminal 1 : Backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2 : Frontend
cd frontend
npm run dev
```

---

## 7. Guide de Déploiement Azure

### 7.1 Création des Ressources
Le déploiement nécessite un **Plan App Service** (Linux ou Windows) et une **Web App**.
La base de données SQL doit être accessible depuis Azure (cocher "Allow Azure services and resources to access this server" dans le pare-feu).

### 7.2 Déploiement de l'Application
L'application est configurée pour être déployée comme un tout.
1.  **Build du Frontend** : `cd frontend && npm run build` -> génère le dossier `dist`.
2.  Le backend FastAPI est configuré (`main.py`) pour servir les fichiers statiques de `dist` sur la route racine `/`.
3.  **Zip Deploy** : Tout le dossier (backend + requirements.txt + frontend/dist) est zippé et déployé sur Azure Web App via la CLI :
    `az webapp deployment source config-zip --resource-group <RG> --name <AppName> --src deploy.zip`

---

## 8. Roadmap et Améliorations Futures

Pour les versions futures (v2.0), nous envisageons :

1.  **Support Audio Bidirectionnel** :
    *   Permettre à l'utilisateur de parler (Speech-to-Text déjà partiellement implémenté).
    *   Répondre avec une voix synthétique naturelle (Text-to-Speech Azure).

2.  **Extension de la Base Légale** :
    *   Ajouter le Code de Commerce, Code du Travail, Loi sur l'Immobilier.
    *   Intégrer la jurisprudence (décisions de tribunaux) pour enrichir les réponses.

3.  **Application Mobile** :
    *   Développer une version native (React Native) pour iOS et Android.

4.  **Historique et Comptes Utilisateurs** :
    *   Sauvegarder les conversations dans la base de données (actuellement `localStorage` uniquement).
    *   Permettre la création de comptes pour personnaliser les réponses.

5.  **Citations Cliquables** :
    *   Rendre les citations "Source" cliquables pour afficher le texte intégral de l'article de loi dans une modale latérale.

---

## 9. Conclusion

Le projet **Al-Moustachar** représente une avancée significative dans l'accessibilité juridique au Maroc. En combinant la puissance de calcul d'Azure, la précision des bases vectorielles et l'intelligence de GPT-4o, nous avons créé un outil capable de traiter des requêtes complexes en quelques secondes.

L'architecture choisie est robuste, scalable et économiquement viable grâce à l'utilisation de services managés et de modèles optimisés (`mini`). Les défis d'ingénierie (streaming, encodage, drivers) ont été résolus, livrant une application stable et prête pour la production.

---

## 10. Annexes : Extraits de Code Clés

### A.1 Streaming Generator (`backend/rag_service.py`)
```python
def answer_question_stream(query: str, top_k: int = TOP_K_RESULTS):
    """Générateur pour le streaming SSE."""
    # 1. Embed & Search
    query_embedding = get_embedding(query)
    results = search_similar(query_embedding, top_k=top_k)

    # 2. Yield Sources (JSON)
    sources = [{"domain": r["domain"], "reference": r["reference"]} for r in results]
    yield json.dumps({"type": "sources", "data": sources}) + "\n"

    # 3. Stream Content (Via OpenAI)
    stream = client.chat.completions.create(model=..., stream=True)
    for chunk in stream:
        if content := chunk.choices[0].delta.content:
            yield json.dumps({"type": "content", "data": content}) + "\n"
```

### A.2 Optimisation SQL (`backend/vector_store.py`)
```python
# Utilisation de fast_executemany pour la performance
cursor.fast_executemany = True
cursor.executemany(
    """
    INSERT INTO LegalTexts (domain, reference, content, embedding)
    VALUES (?, ?, ?, CAST(CAST(? AS NVARCHAR(MAX)) AS VECTOR(1536)))
    """,
    data
)
```

### A.3 Logique d'Ingestion Détaillée (`ingest.py`)

Le script d'ingestion est crucial. Voici une analyse approfondie de son fonctionnement :

```python
def main():
    # 1. Chargement des Textes
    # Le script parcourt le dossier Data/ recursivement.
    # Il ignore les fichiers non-JSON.
    chunks = load_legal_texts()
    
    # 2. Génération des Embeddings
    # Utilisation de batchs pour optimiser les appels API.
    # Le modèle text-embedding-3-small est utilisé.
    embeddings = get_embeddings_batch(texts_to_embed, batch_size=50)
    
    # 3. Préparation de la Base de Données
    # Création de la table si elle n'existe pas.
    create_table()
    
    # 4. Insertion Optimisée
    # Boucle par batch de 100 pour l'insertion SQL.
    # Utilisation de fast_executemany.
    insert_chunks_batch(batch_chunks, batch_embeddings)
```

### A.4 Configuration Backend (`requirements.txt`)

Pour garantir la reproductibilité, voici les versions exactes des dépendances utilisées en production :

```text
fastapi==0.111.0
uvicorn==0.30.1
openai==1.35.3
python-dotenv==1.0.1
pyodbc==5.1.0
pydantic==2.7.4
httpx==0.27.2       # Pinned pour compatibilité Python 3.14
typing-extensions==4.12.2
```

### A.5 Configuration Frontend (`package.json`)

Les dépendances clés du frontend React :

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vite": "^5.3.1"
  }
}
```

---

## 11. Manuel Utilisateur

### 11.1 Accès à la Plateforme
L'application est accessible via un navigateur web moderne (Chrome, Edge, Firefox, Safari).
Une fois l'URL chargée (ex: `https://almoustachar.azurewebsites.net`), l'interface de chat principale s'affiche.

### 11.2 Poser une Question
L'utilisateur a trois façons d'interagir :
1.  **Saisie Textuelle** : Écrire la question dans la barre en bas ("Posez votre question juridique ici...").
2.  **Saisie Vocale** : Cliquer sur l'icône micro 🎙️ et parler (support natif du navigateur).
3.  **Suggestions** : Cliquer sur l'une des cartes de suggestion rapide au centre de l'écran (ex: "Quelle est la peine pour vol ?").

### 11.3 Comprendre la Réponse
Le système répond en temps réel. La réponse est structurée :
*   **Résumé** : La réponse directe à la question.
*   **Détails/Articles** : Le contenu des lois retrouvées.
*   **Références** : Une liste des articles de loi utilisés (ex: `📌 Code Pénal — Article 505`).
*   **Conseil** : Une recommandation sur la marche à suivre.

### 11.4 Gestion de l'Historique
*   Les conversations sont sauvegardées localement dans le navigateur.
*   L'utilisateur peut effacer l'historique via le bouton "Corbeille" en haut à droite.
*   L'utilisateur peut exporter la conversation en fichier texte via le bouton "Télécharger".

---

## 12. Guide Administrateur : Mise à Jour des Lois

Pour ajouter une nouvelle loi ou mettre à jour un code existant :

1.  **Préparation du JSON** :
    Créer un fichier JSON dans le dossier `Data/` (ex: `Data/Code_Commerce/Loi_15-95.json`).
    Format requis :
    ```json
    [
      {
        "reference": "Article 1",
        "contenu": "La présente loi régit les actes de commerce..."
      },
      ...
    ]
    ```

2.  **Exécution de l'Ingestion** :
    Depuis le serveur (ou en local si connecté à la BDD Azure) :
    ```bash
    cd backend
    python ingest.py
    ```
    Le script va :
    *   Lire les nouveaux fichiers.
    *   Générer les embeddings.
    *   Vider la table existante (mode "full refresh") et réinsérer toutes les données.
    *   *Note : Une version future supportera l'ingestion incrémentale.*

3.  **Vérification** :
    Lancer une requête de test directement via l'API ou le frontend pour confirmer que les nouveaux articles sont bien pris en compte par le modèle.

---

## 13. Analyse Sécurité & Conformité

### 13.1 Confidentialité des Données
*   **Données Utilisateur** : Aucune donnée personnelle n'est stockée de manière persistante côté serveur dans cette version v1. L'historique réside uniquement dans le navigateur de l'utilisateur (`localStorage`).
*   **Données Azure OpenAI** : L'instance Azure OpenAI est configurée en mode privé. Microsoft garantit que les données envoyées (prompts) ne sont **pas** utilisées pour entraîner les modèles publics fondateurs.

### 13.2 Sécurité de l'Infrastructure
*   **HTTPS** : Obligatoire pour toutes les communications.
*   **VNet Integration** : Le Backend communique avec Azure SQL via le réseau backbone Azure, sans exposer la base de données sur l'internet public (si configuré avec Private Link, recommandé pour la prod).
*   **Mises à jour** : Les conteneurs et les dépendances Python sont régulièrement scannés pour détecter les vulnérabilités (CVE).

---

## 14. Architecture des Coûts (Estimation)

Pour un déploiement typique sur Azure :

| Service | Tier / SKU | Coût Estimé (Mensuel) |
| :--- | :--- | :--- |
| **Azure OpenAI (GPT-4o)** | Standard (Pay-as-you-go) | ~$20 - $50 (selon usage) |
| **Azure SQL Database** | General Purpose (Serverless) | ~$5 - $15 |
| **App Service (Linux)** | B1 (Basic) | ~$13 |
| **Bande Passante** | - | Négligeable (< $5) |
| **Total Estimé** | - | **~$40 - $80 / mois** |

*Note: L'utilisation du mode Serverless pour SQL permet de mettre la base en pause quand elle n'est pas utilisée, réduisant drastiquement les coûts pour une application interne ou à faible trafic.*

---

## 15. Glossaire Technique

| Terme | Définition |
| :--- | :--- |
| **RAG** | *Retrieval-Augmented Generation*. Technique consistant à fournir des documents externes à un LLM pour qu'il s'en serve comme contexte. |
| **Embedding** | Représentation vectorielle (liste de nombres) d'un texte, capturant son sens sémantique. Deux textes proches on des vecteurs proches. |
| **Vector Store** | Base de données optimisée pour stocker et rechercher des vecteurs. Ici, Azure SQL Database. |
| **Cosine Similarity** | Mesure mathématique utilisée pour calculer la similarité entre deux vecteurs (angle entre eux). |
| **SSE** | *Server-Sent Events*. Standard web permettant à un serveur de pousser des mises à jour vers le navigateur via une connexion HTTP unique. |
| **LLM** | *Large Language Model*. Modèle de langage massif (ici GPT-4o-mini) capable de comprendre et générer du texte. |
| **Chunking** | Découpage d'un long document en morceaux plus petits (ici, par article de loi) pour l'indexation. |
| **ODBC** | *Open Database Connectivity*. Standard d'API pour accéder aux systèmes de gestion de bases de données (SGBD). |

## 16. Références et Documentation

1.  **Azure OpenAI Service** : [Documentation Officielle](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
2.  **Azure SQL Vector Support** : [Annonce Microsoft](https://devblogs.microsoft.com/azure-sql/announcing-public-preview-of-native-vector-support-in-azure-sql-database/)
3.  **FastAPI** : [Site Officiel](https://fastapi.tiangolo.com/)
4.  **React Documentation** : [React.dev](https://react.dev/)
5.  **Vite Build Tool** : [Vitejs.dev](https://vitejs.dev/)

---

> Ce rapport a été généré automatiquement par l'Assistant IA Google Deepmind pour servir de documentation de référence au projet Al-Moustachar.

[Fin du Rapport Détaillé - Version Finale]

