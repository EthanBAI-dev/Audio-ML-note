# -*- coding: utf-8 -*-
"""《三首曲子，一个分类器》的工具包，一课加一点。

第 06 课加了 framing，第 07–09 课加了 time_features，第 10 课加了 probe，
第 14 课开始加入 spectral。后面的课会继续补全 spectral 和 mel。

这里不提前导入所有子模块。这样第 13 课只读取 ``figdata`` 时，不会因为
``io`` 的 librosa 依赖而失败；需要 ``from soundlab import io`` 的课程仍会由
Python 按名称载入对应子模块。
"""

__all__ = ["config", "io", "framing", "time_features", "probe", "spectral",
           "frequency_features", "figdata"]
