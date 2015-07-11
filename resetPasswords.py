import sqlite3
import string
import random
import os
from passlib.hash import bcrypt_sha256


def id_generator(size=24, chars=string.ascii_uppercase + string.digits + string.ascii_lowercase):
	return ''.join(random.choice(chars) for _ in range(size))

dbfile = os.path.dirname(os.path.realpath(__file__)) + '/CTFd/ctfd.db'
conn = sqlite3.connect(dbfile)
c = conn.cursor()

for x in range (2,20):
	password = id_generator()
	hash = bcrypt_sha256.encrypt(password)
	row = (hash, x)
	c.execute('UPDATE teams SET password=? WHERE id=?', row)
	conn.commit()
	row = (x)
	c.execute('SELECT name FROM teams WHERE id=?', (x,))
	data = c.fetchone()
	if data is not None:
		print 'Name:'+ ''.join(data) + ' Pass:' + password
conn.close()




