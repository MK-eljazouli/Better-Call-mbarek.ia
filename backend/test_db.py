import pyodbc
from config import AZURE_SQL_CONNECTION_STRING

try:
    pyodbc.connect(AZURE_SQL_CONNECTION_STRING, timeout=5)
except Exception as e:
    with open("err.txt", "w") as f:
        f.write(str(e))
