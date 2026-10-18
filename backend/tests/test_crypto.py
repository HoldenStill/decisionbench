import pytest
from app.crypto import encrypt_api_key, decrypt_api_key, mask_api_key, get_or_create_secret_key

def test_fernet_encryption_roundtrip():
    raw_key = "sk-or-v1-9876543210fedcba9876543210"
    encrypted = encrypt_api_key(raw_key)
    assert encrypted != raw_key
    assert len(encrypted) > len(raw_key)

    decrypted = decrypt_api_key(encrypted)
    assert decrypted == raw_key

def test_empty_key_encryption():
    assert encrypt_api_key("") == ""
    assert decrypt_api_key("") == ""

def test_corrupted_ciphertext():
    corrupted = "not-a-valid-fernet-token"
    assert decrypt_api_key(corrupted) == ""

def test_api_key_masking():
    # Long openrouter key
    assert mask_api_key("sk-or-v1-1234567890abcdef") == "sk-or-...cdef"
    assert mask_api_key("sk-or-abcdef1234567890") == "sk-or-...7890"
    # Short key
    assert mask_api_key("short") == "********"
    assert mask_api_key("") == ""
