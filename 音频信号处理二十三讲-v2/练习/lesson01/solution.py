"""第 01 课 · 参考答案。先自己写，卡住了再看。"""
import soundfile as sf


def describe(path: str) -> dict:
    info = sf.info(path)
    return {
        "duration_s": info.duration,
        "sample_rate_hz": info.samplerate,
        "channels": info.channels,
        "n_frames": info.frames,
    }


def seconds_to_count(seconds: float, sr: int) -> int:
    return int(round(seconds * sr))


def same_format(paths: list) -> bool:
    kinds = {(describe(p)["sample_rate_hz"], describe(p)["channels"]) for p in paths}
    return len(kinds) == 1


def peek(path: str, at_s: float, n: int):
    sr = sf.info(path).samplerate
    x, _ = sf.read(path, start=int(at_s * sr), frames=n, dtype="float32")
    return x
