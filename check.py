import sqlite3
conn = sqlite3.connect('instance.sqlite')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("所有表：", cursor.fetchall())
cursor.execute("SELECT * FROM user;")
print("user表内容：", cursor.fetchall())
conn.close()