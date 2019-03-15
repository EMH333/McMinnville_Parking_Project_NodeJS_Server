from tinydb import TinyDB, Query
from tinydb.storages import JSONStorage
from tinydb.middlewares import CachingMiddleware


# should start monitoring the serial line for new data
def start_monitoring():
    print("Test")
    pass


# The actual database storing data. This is just a json file so should be pretty easy to maintain
db = TinyDB('/home/ethohampton/db.json', storage=CachingMiddleware(JSONStorage))

if __name__ == '__main__':
    start_monitoring()
    db.insert({"test": "njkls"})
