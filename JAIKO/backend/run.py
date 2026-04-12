import os
import eventlet

# Solo aplicamos monkey_patch en Linux (Railway/producción).
# En Windows (os.name == 'nt') NO se ejecuta.
if os.name != "nt":
    eventlet.monkey_patch()

from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == "__main__":
    # Este bloque SOLO se ejecuta con `python run.py` (desarrollo local).
    # En producción, Gunicorn importa `app` directamente y nunca entra aquí,
    # por lo que allow_unsafe_werkzeug tampoco aplica en producción.
    #
    # Por qué eliminamos allow_unsafe_werkzeug=True:
    # Werkzeug (el servidor de desarrollo de Flask) advierte que no es seguro
    # usarlo en producción. allow_unsafe_werkzeug=True silenciaba ese aviso,
    # pero la solución correcta es simplemente no usar Werkzeug en producción
    # — para eso está Gunicorn. En desarrollo local el aviso no aparece porque
    # FLASK_ENV=development lo desactiva automáticamente.
    port = int(os.environ.get("PORT", 5000))
    is_debug = os.environ.get("FLASK_ENV") == "development"

    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        debug=is_debug,
        use_reloader=False,
        # allow_unsafe_werkzeug eliminado: en desarrollo no es necesario,
        # y en producción usamos Gunicorn (ver Procfile y README).
    )
