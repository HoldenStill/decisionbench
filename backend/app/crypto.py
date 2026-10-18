import os
import stat
from cryptography.fernet import Fernet
from app.config import SECRET_KEY_PATH, DECISIONBENCH_SECRET_KEY, OPENROUTER_API_KEY_ENV

_fernet_instance: Fernet | None = None

def get_or_create_secret_key() -> bytes:
    """
    Retrieve or generate a 32-byte URL-safe base64 Fernet key.
    Checks DECISIONBENCH_SECRET_KEY env var first, then loads from SECRET_KEY_PATH.
    If neither exists, auto-generates a key and saves it with 0600 permissions.
    """
    if DECISIONBENCH_SECRET_KEY:
        key = DECISIONBENCH_SECRET_KEY.strip().encode("utf-8")
        # Validate that it is a valid Fernet key
        Fernet(key)
        return key

    if SECRET_KEY_PATH.exists():
        with open(SECRET_KEY_PATH, "rb") as f:
            key = f.read().strip()
            if key:
                Fernet(key)
                return key

    # Auto-generate a new Fernet key
    new_key = Fernet.generate_key()
    SECRET_KEY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SECRET_KEY_PATH, "wb") as f:
        f.write(new_key)

    # Set 0600 permissions if supported on OS
    try:
        os.chmod(SECRET_KEY_PATH, stat.S_IRUSR | stat.S_IWUSR)
    except Exception:
        pass

    return new_key

def get_fernet() -> Fernet:
    global _fernet_instance
    if _fernet_instance is None:
        key = get_or_create_secret_key()
        _fernet_instance = Fernet(key)
    return _fernet_instance

def encrypt_api_key(raw_key: str) -> str:
    """Encrypt raw API key into base64 ciphertext string."""
    if not raw_key:
        return ""
    f = get_fernet()
    encrypted_bytes = f.encrypt(raw_key.strip().encode("utf-8"))
    return encrypted_bytes.decode("utf-8")

def decrypt_api_key(ciphertext: str) -> str:
    """Decrypt base64 ciphertext string back to raw API key."""
    if not ciphertext:
        return ""
    try:
        f = get_fernet()
        decrypted_bytes = f.decrypt(ciphertext.strip().encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except Exception:
        return ""

def mask_api_key(raw_key: str) -> str:
    """
    Mask API key for safe display in the UI (e.g. sk-or-...xxxx).
    Never leaks the middle or full token.
    """
    if not raw_key:
        return ""
    cleaned = raw_key.strip()
    if len(cleaned) <= 8:
        return "********"
    if cleaned.startswith("sk-or-v1-"):
        suffix = cleaned[-4:]
        return f"sk-or-...{suffix}"
    if cleaned.startswith("sk-or-"):
        suffix = cleaned[-4:]
        return f"sk-or-...{suffix}"
    prefix = cleaned[:4]
    suffix = cleaned[-4:]
    return f"{prefix}...{suffix}"
