import sqlite3
import os

dbfile = os.path.dirname(os.path.realpath(__file__)) + '/CTFd/ctfd.db'
conn = sqlite3.connect(dbfile)
c = conn.cursor()
c.execute('DELETE FROM solves')
c.execute('DELETE FROM tracking')
c.execute('DELETE FROM wrong_keys')
conn.commit()
conn.close()




