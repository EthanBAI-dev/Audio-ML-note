"""pytest 配置：决定检查「你的代码」还是「参考答案」。

    pytest 音频信号处理二十三讲-v2/练习/lesson09              # 检查你写的 exercise.py
    pytest 音频信号处理二十三讲-v2/练习/lesson09 --solution   # 检查参考答案 solution.py
"""
import importlib.util
import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent
CODE = ROOT.parents[1] / "音频信号处理二十三讲" / "课程代码"
sys.path.insert(0, str(CODE))          # 练习里可以直接 from soundlab import ...


def pytest_addoption(parser):
    parser.addoption("--solution", action="store_true",
                     default=os.environ.get("EXERCISE_TARGET") == "solution",
                     help="检查参考答案 solution.py，而不是 exercise.py")


def _load(path):
    name = f"_ex_{path.parent.name}_{path.stem}"
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture(scope="module")
def ex(request):
    """当前测试所在目录里的 exercise.py（或 --solution 时的 solution.py）。"""
    folder = Path(request.module.__file__).parent
    return _load(folder / ("solution.py" if request.config.getoption("--solution") else "exercise.py"))
