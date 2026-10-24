from __future__ import annotations

import os
from types import SimpleNamespace
import unittest

os.environ.setdefault("DISCORD_TOKEN", "test-token")

from bot import DiscordAudioSink, _voice_client_is_healthy, _voice_participant_names


class RecordingBuffer:
    def __init__(self) -> None:
        self.calls: list[tuple[int, str, bytes]] = []

    def push(self, user_id: int, display_name: str, pcm: bytes) -> None:
        self.calls.append((user_id, display_name, pcm))


class DiscordAudioSinkTests(unittest.TestCase):
    def test_uses_cached_name_when_discord_returns_only_an_id(self) -> None:
        buffer = RecordingBuffer()
        sink = DiscordAudioSink(buffer, {42: "Ember"})

        sink.write(SimpleNamespace(pcm=b"audio"), SimpleNamespace(id=42))

        self.assertEqual(buffer.calls, [(42, "Ember", b"audio")])

    def test_uses_stable_fallback_for_an_unknown_id(self) -> None:
        buffer = RecordingBuffer()
        sink = DiscordAudioSink(buffer, {})

        sink.write(SimpleNamespace(pcm=b"audio"), SimpleNamespace(id=99))

        self.assertEqual(buffer.calls, [(99, "Discord user 99", b"audio")])


class ParticipantNameTests(unittest.IsolatedAsyncioTestCase):
    async def test_fetches_members_missing_from_the_local_cache(self) -> None:
        member = SimpleNamespace(id=42, display_name="Bruno", bot=False)
        guild = SimpleNamespace(
            get_member=lambda user_id: None,
            fetch_member=lambda user_id: _return_async(member),
        )
        channel = SimpleNamespace(members=[], voice_states={42: object()})

        names = await _voice_participant_names(guild, channel)

        self.assertEqual(names, {42: "Bruno"})


class VoiceHealthTests(unittest.TestCase):
    def test_requires_connection_recording_and_expected_channel(self) -> None:
        healthy = SimpleNamespace(
            channel=SimpleNamespace(id=7),
            is_connected=lambda: True,
            is_recording=lambda: True,
        )
        disconnected = SimpleNamespace(
            channel=SimpleNamespace(id=7),
            is_connected=lambda: False,
            is_recording=lambda: True,
        )
        stopped = SimpleNamespace(
            channel=SimpleNamespace(id=7),
            is_connected=lambda: True,
            is_recording=lambda: False,
        )

        self.assertTrue(_voice_client_is_healthy(healthy, 7))
        self.assertFalse(_voice_client_is_healthy(disconnected, 7))
        self.assertFalse(_voice_client_is_healthy(stopped, 7))
        self.assertFalse(_voice_client_is_healthy(healthy, 8))
        self.assertFalse(_voice_client_is_healthy(None, 7))


async def _return_async(value):
    return value


if __name__ == "__main__":
    unittest.main()
