import eventlet
eventlet.monkey_patch()

from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=False,      # <-- CRÍTICO: el werkzeug reloader crea un
                                 # proceso hijo donde eventlet.monkey_patch()
                                 # no funciona, rompiendo los emit() a otros
                                 # clientes. Sin reloader, eventlet funciona ok.
        allow_unsafe_werkzeug=True
    )