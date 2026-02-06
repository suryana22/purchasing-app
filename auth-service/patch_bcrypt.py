import bcrypt
try:
    if not hasattr(bcrypt, '__about__'):
        class About:
            __version__ = bcrypt.__version__
        bcrypt.__about__ = About()
except Exception:
    pass
