# 动手练习（v2 试行）

每课一个文件夹：

- `exercise.py`：骨架已经搭好，把标着 `TODO` 的地方补上；
- `test_lessonNN.py`：一条命令告诉你哪里对、哪里错；
- `solution.py`：参考答案，卡住了再看。

在仓库根目录运行：

```bash
pip install -r 音频信号处理二十三讲/课程代码/requirements.txt pytest
pytest 音频信号处理二十三讲-v2/练习 --solution   # 先确认环境没问题，应全部通过
pytest 音频信号处理二十三讲-v2/练习/lesson09     # 检查你写的第 09 课
```

练习用的音频和工具包都来自 `音频信号处理二十三讲/课程代码/`，不用另外准备。
