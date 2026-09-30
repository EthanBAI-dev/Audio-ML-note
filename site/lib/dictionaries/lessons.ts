import type { Locale } from '../i18n';

/** 23 讲课名和导读的日文、英文译文。中文原文仍然从课程 Markdown 里读，这里不重复。
 *  改了中文课名或导读，记得回来同步这里。导读里的数字都和中文原文一致，改的时候别漏。 */
export type LessonText = { title: string; lead: string };

/** 某一讲在当前语言下的课名和导读。没有译文时退回中文，并把 lang 标成 zh-CN，读屏和字体才对。 */
export function lessonText(lang: Locale, lesson: { id: string } & LessonText): LessonText & { lang?: string } {
  const translated = lang === 'zh' ? undefined : LESSON_TEXT[lang][lesson.id];
  if (translated) return translated;
  return { title: lesson.title, lead: lesson.lead, lang: lang === 'zh' ? undefined : 'zh-CN' };
}

export const LESSON_TEXT: Record<Exclude<Locale, 'zh'>, Record<string, LessonText>> = {
  ja: {
    '01': {
      title: 'プログラムがクラシック・ジャズ・ロックを聞き分けるには、まずどの一歩を越えなければならないのか？',
      lead: 'プログラムに猫の写真を渡すと、受け取るのはきちんと並んだ色の格子です。車が通り過ぎる音を渡すと、受け取るのは時間とともに次々に出てくる長い数字の列です。どちらも「分類」と呼びますが、音のほうには工程が 1 つ多くあります。まず誰かがその数字の列を、互いに比べられる証拠に整理しておかないと、プログラムには比べるものがありません。この工程を音声信号処理と呼び、この 23 講で取り組むことです。この講では具体的なアルゴリズムは扱わず、3 つのことだけを決めます。プログラムにどんな課題をこなさせるのか、23 講をどんな順序で進むのか、どんな予備知識が必要なのか。',
    },
    '02': {
      title: '音はどうやって生まれ、どうやって録音の中のあの線になるのか？',
      lead: '前の講で課題が決まりました。プログラムにクラシック・ジャズ・ロックを聞き分けさせることです。でもプログラムが受け取るのは長い数字の列です。この数字はどこから来るのでしょうか。この講はいちばん最初から話します。物体が振動すると周りの空気を押し、その押し合いが輪のように広がってマイクに届きます。マイクは一瞬ごとの押す強さを 1 つの数として記録します。その数を時間順に描いたものが、録音ソフトに出てくる震える線で、波形と呼びます。この線には 3 つのことが同時に隠れています。どれだけ速く振動するか、どれだけ大きく振動するか、そしてどんな音色に聞こえるか。この講では前の 2 つを説明し、音色は第 03 講に回します。',
    },
    '03': {
      title: '音量バーは動いていないのに、曲を変えるとはっきりうるさくなるのはなぜ？',
      lead: '前の講で波形の周波数と振幅を説明しましたが、まだ 2 つ残っています。音の強さはそもそもどう測るのか、そして音色とは何か。この講では音源から出発して、一段ずつ耳へ近づいていきます。音源が 1 秒間に出すエネルギー（音響パワー）→ あなたのいる位置まで届いたときの 1 平方メートルあたりの量（音の強さ）→ やっと聞こえる音から痛みを感じる音まで、10 兆倍もの差がある → だからデシベルを使って読みやすい数に縮める → それでもデシベルは、あなたが感じる音の大きさ（ラウドネス）とは同じではない。最後に「音量は同じなのに違う」という問いに答えます。高さと大きさをそろえても残る違いを音色と呼び、それは 3 つの要素で決まります。',
    },
    '04': {
      title: '連続した音は、どうやって数字の列になり、また音に戻るのか？',
      lead: 'ここまでの 2 講で扱ったのは、どれも連続して変化するものでした。空気の圧力、周波数、音の大きさ。でもコンピューターはどれもそのままでは保存できません。無限に多くの時刻も、無限に多くの値も記録できないからです。この講では変換の流れを最後までたどります。マイクが連続して変化する電圧を出す → ADC という部品がそれを数字の列に変える → あとは自由に計算する → 最後に DAC という部品が数字を連続した電圧に戻し、スピーカーを動かす。ADC がすることは 2 つだけです。どれくらいの間隔で測るか（サンプリング）、1 回ごとにどれくらい細かく測るか（量子化）。この 2 つにはそれぞれ代償があり、その性質はまったく違います。一方はあとから補えますが、もう一方は二度と取り戻せません。',
    },
    '05': {
      title: '録音から何を計算してプログラムに渡すべきか？——音声特徴量の 5 つの軸',
      lead: '前の講までで、30 秒の音楽は 60 万個あまりの数字の列になりました（1 秒に 2 万 2 千回あまり、それを 30 秒分）。この数字の列をそのまま分類プログラムに渡してもうまくいきません。長すぎるし、細かすぎるし、1 つの数だけでは何もわからないからです。そこでまず、いくつかの要約を計算します。この要約を音声特徴量と呼びます。「どの音声特徴量を使えばいいか」と検索すると長い用語リストが出てきますが、それぞれの名前が答えている問いは同じではありません。この講ではリストを暗記するのではなく、分類の地図を示します。どんな音声特徴量も、5 つの軸で位置を決められます。抽象度、時間の範囲、音楽のどの性質か、信号の領域、そしてどんな方法で計算するか。',
    },
    '06': {
      title: '録音全体から、比べられる数字の列になるまでに、どんな段階があるのか？',
      lead: '前の講では「何を計算するか」を 5 つの軸に分けました。そのうち信号の領域の軸は、時間領域・周波数領域・時間周波数領域の 3 段階です。この講では前の 2 つについて、処理の流れを最初から最後まで説明します。ADC から出てきた数字の列から始まり、最後にプログラムに渡す数個の数字までのあいだに、どんな段階があり、なぜどれも欠かせないのか。2 つの流れは前半が同じで（どちらもまず区切る）、分かれ道は周波数領域のほうにあります。そちらには「窓をかける」段階が 1 つ多いのです。そして窓をかけることで新しい問題が生まれ、「フレームは重ならなければならない」という結論が導かれます。',
    },
    '07': {
      title: '周波数の分析をせず、あの曲線だけを見て何がわかるのか？',
      lead: '前の講で処理の流れはできましたが、「フレームごとに計算する」の欄がまだ空いています。この講では時間領域の 3 つの答えでそこを埋めます。振幅包絡（このフレームの最大値はいくつか）、RMS＝二乗平均平方根（このフレーム全体の強さはどれくらいか）、ゼロ交差率（このフレームで中心線を何回横切るか）。どれも周波数の分析はいらず、曲線そのものを見るだけです。この 3 つは入れ替えのきく名前ではなく、3 つの違う問いです。それぞれに独自の公式、弱点、使いどころがあります。この講では 3 つの公式を、8 個の数からなる小さなフレームでそれぞれ手計算します。ペンがあれば自分で確かめられます。',
    },
    '08': {
      title: '振幅包絡の公式を、本当に動くコードにする',
      lead: '前の講で 3 つの公式を説明しましたが、実装はまだ 1 行も書いていません。この講では最初の 1 つ、振幅包絡を一から作ります。3 つの音楽を読み込み、基本情報を確認し、波形を描き、包絡を自分で書き、フレーム番号を秒に換算し、最後に包絡を波形に重ねて 3 つのジャンルを比べます。途中で、見落としやすい abs（絶対値）に気づきます。曲全体の最大値ではほとんど影響が見えないのに、フレームごとに調べると、3 つの音楽でフレームの 18% から 36% が低く見積もられてしまいます。',
    },
    '09': {
      title: 'まずライブラリで計算し、次に自分で書き、両方を一致させる',
      lead: 'この講では残り 2 つの時間領域の特徴量を実装します。やり方は前の講と違います。まず librosa で 1 行で計算し、次に一から自分で書き、2 つの結果をフレームごとに突き合わせます。これは形だけの作業ではありません。値が合わなければ、「1 フレームがどのサンプルを含むか」についてあなたとライブラリの理解が違うということで、その先の比較はすべて成り立ちません。RMS は両者がぴったり一致します（フレームごとの最大差 8×10⁻⁹）。ゼロ交差率はわざと一致させず、比はちょうど 1024/1023 になります。これこそ第 07 講で残した「K で割るか、K−1 で割るか」の問題です。',
    },
    '10': {
      title: 'コンピューターは 1 本の曲線から、どんな高さの成分でできているかをどうやって見つけるのか？',
      lead: 'ここまでの 4 講で、「曲線だけを見る」方法で問えることはすべて問いました。でも、それでは決して答えられないこともあります。ピアノの鍵盤を 3 つ同時に押しても、マイクが記録するのは起伏する 1 本の曲線だけで、波形からは 3 つの音が入っていることがまったくわかりません。この講では視点を変えます。時間とともにどう起伏するかではなく、どんな高さの成分でできているかを問います。やり方は意外なほど素朴です。周波数のわかっている波を用意して、1 点ずつ掛け合わせ、平均をとります。合っていれば平均はゼロにならず、合っていなければプラスとマイナスが打ち消し合ってゼロになります。すべての周波数で試して得られる曲線が、スペクトルです。',
    },
    '11': {
      title: '1 つの数に、「どれくらい強いか」と「どこから始まるか」を同時に入れるには？',
      lead: '前の講には宿題が残りました。探りの波 1 本だと、始まる位置のずれで結果が消えてしまうので、2 本必要になる、ということです。そのため周波数ごとに得られるのは 1 つではなく 2 つの数です。強さと、どこから始まるか。ところが「強さ」は普通の数で、普通の数 1 つに 2 つの情報は入りません。この講で導入する複素数は、まさにこのためのものです。複素数は平面上の 1 つの点で、点はもともと 2 つの情報を持っています。原点からどれだけ離れているか、どの方向にあるか。前者が強さ、後者が始まる位置に対応します。この講では抽象的な数学は扱わず、前の講で測った 2 つの読み取り値を、実際に 1 つの複素数にまとめます。',
    },
    '12': {
      title: '「どれくらい強いか」と「どこから始まるか」を、1 つの係数に書き込む',
      lead: '前の講で複素数の準備ができました。絶対値が強さを、角度が始まる位置を表します。この講ではそれを正式にフーリエ変換に組み込みます。周波数ごとに 1 つの複素数の係数を計算し、その絶対値をとれば振幅スペクトル、角度をとれば位相スペクトルになります。見た目はこわい公式も、分解すればやっていることは第 10 講と同じです。波を掛けて、平均をとる。ただオイラーの公式によって、2 本の探りの波が e の指数 1 つにまとめられているだけです。最後に、変換して元に戻す往復を一通りやります。1 点ごとの最大誤差は 2.5×10⁻¹³ です。ところが位相を捨ててから戻すと、誤差は 2.05 になります。8 兆倍の違いです。',
    },
    '13': {
      title: '有限個の数字しか持たないコンピューターで、どうやってフーリエ変換をするのか？',
      lead: '前の講の公式は、時間が連続していて、無限に多くの周波数を調べられることを前提にしていました。実際のコンピューターが持っているのは有限個のサンプルだけです。公式を本当に動かすには、時間と周波数をそれぞれ 1 回ずつ制限する必要があります。N 個のサンプルを残し、計算する周波数の区切り（ビン）も N 個だけにします。こうして得られる計算を離散フーリエ変換、略して DFT と呼びます。',
    },
    '14': {
      title: 'Python で実際の音のスペクトルを読む：4 つの音はなぜ違って見えるのか？',
      lead: '同じ音を弾いても、バイオリン、ピアノ、サックスはやはり違って聞こえます。ノイズはまた別の姿をしています。この講では 4 つの録音を Python に渡し、周波数ごとの強さの分布を比べ、横軸を本物の Hz として読めるようにします。',
    },
    '15': {
      title: '曲全体のスペクトルでは、音がいつ鳴ったかがわからない：短時間フーリエ変換',
      lead: '2 つの音がどちらも低い音と高い音を順に鳴らし、順番だけが逆だったとします。曲全体の周波数の結果は、まったく同じに見えることがあります。「どちらの音が先に出たか」をプログラムに取り戻させるには、録音を互いに重なる小さな区間に分け、位置を移すたびに計算し直す必要があります。',
    },
    '16': {
      title: '同じ数字なのに、描き方を変えないと見えない：Python でスペクトログラムを描く',
      lead: '前の講で、録音を「どの高さの成分が、どの時間に、どれくらい強いか」という大きな表にしました。この講ではそれを実際に描きます。ところが最初に描いた図はほとんど真っ黒です。計算を間違えたのではなく、色のつけ方がよくないのです。この表のマス目の 99.70% は、いちばん強いマスの 100 分の 1 にも届きません。比例のまま色を割り当てると、それらはすべて同じ黒に押し込まれます。デシベルで色をつけ、縦軸を倍数の目盛りに変えると、同じ数字がすべて見えるようになります。',
    },
    '17': {
      title: '聞こえ方に合わせて、周波数の物差しを刻み直すには：メル尺度',
      lead: '前の講で縦軸を倍数の目盛りに変えたのは、音楽では 1 オクターブが周波数 2 倍にあたるからでした。でも人の耳は、完全に倍数どおりに聞いているわけではありません。これを示す古い実験があります。C2 から C4 に上がるときと、G6 から A6 に上がるときでは、振動の速さの差は 196 と 192 で、ほとんど同じです。ところが前者は 2 オクターブ上がったように聞こえ、後者は全音 1 つ分にしか聞こえません。同じ差なのに、聞こえ方は 12 倍違います。この講では周波数の軸を、聴覚の実験から刻んだ物差しに取り替え、さらに 10 個の三角形で 1025 行を 10 行に圧縮します。',
    },
    '18': {
      title: '形は合っているのに、数字がまったく違う：Python でメルスペクトログラムを取り出す',
      lead: '前の講では、メルフィルターの一式（10 個の三角形で、それぞれが一定の周波数帯だけを担当し、真ん中がいちばん敏感で、両端に向かって次第に効かなくなる）を 5 つの手順で自作しました。この講では既製のライブラリにも作らせ、2 つの結果を並べます。形はまったく同じなのに、数字は 1 つも合いません。違いを追いかけていくと、3 つの初期設定が見つかります。ライブラリが既定で使う最高周波数は 8000 ではないこと、既定で各三角形を面積が等しくなるように縮めていること、そもそも同じメルの公式を使っていないこと。この 3 か所を直すと、最大差は 0.9999 から 0.0147 に下がります。残ったわずかな差にも、きちんと理由があります。',
    },
    '19': {
      title: '「誰が声を出しているか」と「どんな音を出しているか」を分ける：MFCC とは何か',
      lead: '人の声には 2 つのものが同時に入っています。声帯がどれくらい速く振動するか（音の高さを決める）と、口がどんな形になっているか（「あ」なのか「い」なのかを決める）。スペクトル上では両者は掛け算の関係にあり、絡み合っていてどちらも取り出せません。この講でやることは 1 つだけです。対数をとると、掛け算が足し算になります。足し算になった 2 つは、もう一度変換すれば 1 本の軸の両端に分かれます。この講ではその道のりの各段階を測ります。包絡の 98.3% が左側に、励振の 99.0% が右側にあり、1 か所で切れば分けられます。最後の DCT は、隣り合うメル帯どうしの相関 0.95 を 0.15 まで下げ、最初の 13 個の係数に元のスペクトルの変化の 98.2% が収まります。',
    },
    '20': {
      title: '1 行のコードが代わりにやっている 4 つの手順：Python で MFCC を取り出す',
      lead: '前の講で MFCC の流れ全体を手で書きました。この講ではそれをライブラリに任せます。librosa.feature.mfcc は 1 行で 13 行の係数を返し、librosa.feature.delta がさらに 1 次と 2 次の変化率を出します。つなげれば、よく言われる 1 フレームあたり 39 次元になります。いつものように、1 行で結果を得たら最初にやるのは、それを前の講で手書きした 4 つの手順に分解し直して、桁まで突き合わせることです。4 つの初期設定をすべて正しく直して、ようやく最大差が 0.0000 になります。途中で 2 つのことにぶつかります。delta は「次のフレームから前のフレームを引く」ではないこと。そして 13 個の係数のどれ 1 つをとっても、単独では 3 つのジャンルを分けられないことです。',
    },
    '21': {
      title: 'スペクトルの 1 列を 3 つの数にまとめるには：帯域エネルギー比、スペクトル重心、帯域幅',
      lead: 'スペクトログラムの 1 列には、千を超える周波数のマスがあります。情報はそろっていますが、3 つの簡単な問いにそのまま答えるのには向いていません。高い周波数に比べて低い周波数がどれくらいあるか？ 周波数の重心はどこか？ 周波数は重心のまわりにどれくらい広がっているか？ この講では 3 つの問いに 1 つずつ数を割り当てます。帯域エネルギー比、スペクトル重心、スペクトル帯域幅です。さらに答えのわかっているスペクトルを 3 列作り、この 3 つの数がそれぞれ別の側面を見ていて、どれも他の代わりにはならないことを確かめます。',
    },
    '22': {
      title: 'Python で帯域エネルギー比を実装する：2000 Hz はどのマスで切るべきか',
      lead: 'BER（帯域エネルギー比）の公式は割り算 1 つだけですが、コードにはエラーを出さない落とし穴が 2 つあります。「時間フレームの数」を「周波数のマスの数」と取り違えること、そして近似したマスの間隔を使って 2000 Hz を間違った側で切ってしまうことです。この講では 30 秒の音楽 3 つについて、フレームごとに BER を計算します。正しい境界は第 186 マスです。1292 個の時間フレームを周波数のマスの数と取り違えると、境界は第 234 マス、実際には約 2519 Hz にずれます。ドビュッシーの曲の BER の中央値は、そのせいで 4.37 dB 大きくなります。',
    },
    '23': {
      title: 'スペクトル重心と帯域幅：周波数の中心と広がりをどう測るか',
      lead: 'スペクトル重心と帯域幅は、ライブラリの関数 2 行で済まされてしまうことがよくあります。この講では逆の順序で進めます。まずライブラリの既定の設定で 3 つの音楽の時間変化を求め、次に 2 行の関数を公式に分解して、自分でフレームごとに計算し直します。重心の最大差はわずか 1.917e-05 Hz、帯域幅の最大差はわずか 1.156e-05 Hz です。突き合わせる過程で、取り違えやすい定義が 1 つ明らかになります。平均絶対距離は p = 1 ですが、ライブラリ関数が既定で計算するのは二乗平均平方根距離 p = 2 で、この 3 つの音楽では両者に 1.30〜1.54 倍の差が出ます。',
    },
  },
  en: {
    '01': {
      title: 'What does a program have to get past before it can tell classical, jazz and rock apart?',
      lead: 'Give a program a photo of a cat and it receives a neat grid of colours. Give it the sound of a passing car and it receives a long list of numbers arriving one after another over time. Both jobs are called “classification”, but sound needs one extra step: someone first has to turn that list of numbers into evidence that can be compared, or the program has nothing to compare. That step is called audio signal processing, and it is what these 23 lessons are about. This lesson covers no specific algorithm. It settles three things: what task we want the program to do, the order the 23 lessons follow, and what background you need.',
    },
    '02': {
      title: 'How is sound made, and how does it become the line you see in a recording?',
      lead: 'The last lesson set the task: get a program to tell classical, jazz and rock apart. But what the program receives is a long list of numbers. Where do those numbers come from? This lesson starts at the very beginning. An object vibrates and pushes the air around it; that push spreads outward, ring after ring, until it reaches a microphone, and the microphone records how hard the air is pushing at each instant as a number. Plot those numbers over time and you get the wobbly line in a recording app, called a waveform. The line hides three things at once: how fast the vibration is, how big it is, and what it sounds like (its timbre). This lesson covers the first two; timbre is left for Lesson 03.',
    },
    '03': {
      title: 'The volume meter hasn’t moved, so why does another song sound clearly louder?',
      lead: 'The last lesson covered frequency and amplitude in a waveform, but two things are still missing: how do we actually measure how strong a sound is, and what is timbre? This lesson starts at the sound source and works toward the ear, one layer at a time: how much energy the source gives off each second (sound power) → how much of it reaches each square metre where you are (sound intensity) → from the faintest sound you can hear to the point where it hurts, there is a factor of ten trillion → so we use decibels to squeeze that into a readable number → yet decibels are still not the loudness you hear. Finally we answer the “same volume, but different” question: once pitch and loudness are matched, the difference that remains is called timbre, and it comes down to three things.',
    },
    '04': {
      title: 'How does continuous sound become a list of numbers, and then turn back into sound?',
      lead: 'The previous two lessons dealt only with things that change continuously: air pressure, frequency, loudness. A computer can store none of them as they are: it cannot keep infinitely many moments, or infinitely many possible values. This lesson follows the whole conversion chain: a microphone produces a continuously changing voltage → a component called an ADC turns it into a list of numbers → you compute whatever you like → finally a component called a DAC turns the numbers back into a continuous voltage that drives a speaker. The ADC does only two things: how often it measures (sampling) and how finely it measures each time (quantisation). Each has its own cost, and the two costs are completely different in kind: one can be fixed afterwards, the other can never be recovered.',
    },
    '05': {
      title: 'What should we compute from a recording and hand to the program? Five dimensions of audio features',
      lead: 'By the end of the last lesson, 30 seconds of music had become a list of more than 600,000 numbers (over 22,000 per second, for thirty seconds). Handing that list straight to a classifier doesn’t work: it is too long, too detailed, and no single number means anything on its own. So we first compute some summaries, called audio features. Search for “which audio features should I use” and you get a long list of names, but those names don’t answer the same kind of question. Instead of memorising the list, this lesson gives you a map: any audio feature can be placed along five dimensions — level of abstraction, time scope, musical aspect, signal domain, and the method used to compute it.',
    },
    '06': {
      title: 'From a whole recording to a list of comparable numbers: what steps lie in between?',
      lead: 'The last lesson split “what to compute” into five dimensions, and the signal-domain dimension has three levels: time domain, frequency domain and time–frequency. This lesson walks through the full pipeline for the first two — from the list of numbers coming out of the ADC to the few numbers finally handed to the program — explaining each step and why none can be skipped. Both pipelines share the same first half (both start by cutting the signal into pieces). They part ways on the frequency-domain side, which has one extra step: windowing. And windowing creates a new problem, which leads to the conclusion that frames must overlap.',
    },
    '07': {
      title: 'Without any frequency analysis, what can the curve alone tell us?',
      lead: 'The last lesson built the pipeline, but the “compute per frame” box is still empty. This lesson fills it with three time-domain answers: the amplitude envelope (the highest value in this frame), the root mean square, or RMS (how strong this frame is overall), and the zero-crossing rate (how many times this frame crosses the centre line). None of them needs any frequency analysis; they look only at the curve itself. They are not three interchangeable names but three different questions, each with its own formula, weaknesses and uses. This lesson works through all three formulas by hand on a small frame of eight numbers, so you can check them with a pen.',
    },
    '08': {
      title: 'Turning the amplitude-envelope formula into code that actually runs',
      lead: 'The last lesson explained three formulas but didn’t implement a single line. This lesson builds the first one from scratch: the amplitude envelope. We load three music clips, check their basic information, plot the waveforms, write the envelope by hand, convert frame numbers to seconds, and finally overlay the envelope on the waveform to compare the three genres. Along the way we find an easy-to-miss abs (absolute value): it makes almost no visible difference to the maximum over a whole clip, but frame by frame it causes 18% to 36% of the frames in the three clips to be underestimated.',
    },
    '09': {
      title: 'Call the library first, write it by hand second, then make them agree',
      lead: 'This lesson implements the two remaining time-domain features, in a different way from last time: first compute them in one line with librosa, then write them from scratch, then compare the two results frame by frame. This isn’t a formality. If the numbers don’t match, you and the library disagree about which samples make up a frame, and every comparison after that falls apart. For RMS the two agree exactly (largest per-frame difference 8×10⁻⁹). For the zero-crossing rate they deliberately don’t: the ratio is exactly 1024/1023 — the “divide by K or by K−1” question left open in Lesson 07.',
    },
    '10': {
      title: 'How does a computer find which high and low components a single curve is made of?',
      lead: 'The previous four lessons asked everything you can ask by looking at the curve alone. But some things it can never answer: press three piano keys at once and the microphone records just one rising and falling curve — nothing in the waveform shows that there are three notes inside. This lesson changes the question: not how the signal rises and falls over time, but which high and low components it is made of. The method is surprisingly plain: take a wave of known frequency, multiply it with the signal point by point, and average. If they match, the average isn’t zero; if they don’t, the positives and negatives cancel out to zero. Try every frequency, and the curve you get is the spectrum.',
    },
    '11': {
      title: 'How can one number hold both “how strong” and “where it starts”?',
      lead: 'The last lesson left a loose end: a single probe wave can be wiped out depending on where the signal starts, so we need two. That means each frequency gives us not one number but two — the strength, and where it starts. But “strength” is an ordinary number, and one ordinary number can’t hold two things. Complex numbers, introduced in this lesson, exist to solve exactly this. A complex number is a point on a plane, and a point naturally carries two pieces of information: how far it is from the origin, and in which direction. The first corresponds to strength, the second to the starting point. No abstract maths here: we simply combine the two readings measured in the last lesson into one complex number.',
    },
    '12': {
      title: 'Writing “how strong” and “where it starts” into a single coefficient',
      lead: 'The last lesson got complex numbers ready: the magnitude records strength, the angle records the starting point. This lesson builds them into the Fourier transform properly. For each frequency we compute one complex coefficient; its magnitude gives the magnitude spectrum and its angle gives the phase spectrum. The scary-looking formula, once taken apart, still does what Lesson 10 did — multiply by a wave, then average — except that Euler’s formula merges the two probe waves into a single exponential of e. Finally we do a full round trip, transforming and transforming back: the largest point-by-point error is 2.5×10⁻¹³. Throw the phase away before transforming back, and the error becomes 2.05 — eight trillion times larger.',
    },
    '13': {
      title: 'A computer only has a finite number of values. How can it do a Fourier transform?',
      lead: 'The last lesson’s formula assumed that time is continuous and that infinitely many frequencies can be checked. A real computer only has a finite number of samples. To make the formula actually run, we limit time and frequency once each: keep N samples, and compute only N frequency bins. The result is called the discrete Fourier transform, or DFT.',
    },
    '14': {
      title: 'Reading the spectrum of real sounds in Python: why do four sounds look so different?',
      lead: 'Play the same note and a violin, a piano and a saxophone still sound different; noise looks different again. This lesson hands four recordings to Python, compares how their strength is spread across frequencies, and turns the horizontal axis into real Hz.',
    },
    '15': {
      title: 'Why a whole-clip spectrum can’t tell when a sound happened: the short-time Fourier transform',
      lead: 'Two clips each play a low note and a high note one after the other, only in swapped order — and their whole-clip frequency results can look exactly the same. To let the program recover which sound came first, we split the recording into small overlapping pieces and recompute at every position.',
    },
    '16': {
      title: 'Same numbers, but you only see them when you draw them differently: plotting a spectrogram in Python',
      lead: 'The last lesson turned a recording into a big table of which high and low components are how strong at which moment. This lesson actually draws it. But the first picture comes out almost entirely black — not because the maths is wrong, but because of how the colours are assigned: 99.70% of the cells in the table are less than one hundredth of the strongest cell, so colouring in plain proportion squeezes them all into the same black. Colour in decibels and put the vertical axis on a ratio scale, and the same numbers all become visible.',
    },
    '17': {
      title: 'Re-marking the frequency ruler to match how we hear: the mel scale',
      lead: 'The last lesson put the vertical axis on a ratio scale because, in music, going up an octave means doubling the frequency. But the human ear doesn’t hear strictly in ratios. An old experiment shows this: going from C2 up to C4 and from G6 up to A6 changes the vibration rate by 196 and 192 — almost the same. Yet the first sounds like a jump of two octaves and the second like a single whole tone. The same difference, but a twelvefold difference in what you hear. This lesson swaps the frequency axis for a ruler marked out by listening experiments, then uses ten triangles to squeeze 1025 rows down to 10.',
    },
    '18': {
      title: 'The shapes match, but every number is different: extracting a mel spectrogram in Python',
      lead: 'The last lesson built the set of mel filters by hand in five steps — ten triangles, each covering one band of frequencies, most sensitive in the middle and fading out toward the edges. This lesson has a ready-made library build them too and puts the two results side by side: the shapes are identical, yet not a single number agrees. Following the differences uncovers three defaults: the library’s default top frequency isn’t 8000, it rescales every triangle to equal area by default, and it doesn’t even use the same mel formula. Fix those three and the largest difference drops from 0.9999 to 0.0147. Even the small difference that remains has an explanation.',
    },
    '19': {
      title: 'Separating who is making the sound from which sound they make: what MFCCs are',
      lead: 'A voice carries two things at once: how fast the vocal folds vibrate (which sets the pitch) and what shape the mouth makes (which decides whether you hear “ah” or “ee”). In the spectrum these two are multiplied together, tangled so that neither can be pulled out. This lesson takes just one step: take a logarithm, and multiplication becomes addition; two things that are added can then be moved to opposite ends of one axis with another transform. Each step along the way is measured: 98.3% of the envelope sits on the left and 99.0% of the excitation on the right, so a single cut separates them. The final DCT brings the correlation between neighbouring mel bands down from 0.95 to 0.15, and the first 13 coefficients hold 98.2% of the variation in the original spectrum.',
    },
    '20': {
      title: 'The four steps one line of code does for you: getting MFCCs in Python',
      lead: 'The last lesson wrote the whole MFCC chain by hand. This lesson hands it to the library: librosa.feature.mfcc returns 13 rows of coefficients in one line, and librosa.feature.delta adds the first- and second-order rates of change — together, the familiar 39 dimensions per frame. As usual, the first thing to do after getting a one-line result is to break it back into the four hand-written steps from the last lesson and line them up digit by digit: only when all four defaults are set correctly does the largest difference drop to 0.0000. Two surprises come up along the way: delta is not “next frame minus previous frame”, and no single one of the 13 coefficients can separate the three genres on its own.',
    },
    '21': {
      title: 'Squeezing one column of a spectrum into three numbers: band energy ratio, spectral centroid and bandwidth',
      lead: 'One column of a spectrogram has over a thousand frequency cells. It is complete, but not suited to answering three simple questions directly: how much low frequency is there compared with high? Where is the centre of gravity of the frequencies? How widely are they spread around that centre? This lesson gives each question its own number: the band energy ratio, the spectral centroid and the spectral bandwidth. We also build three spectrum columns with known answers to show that the three numbers look at different sides of the sound, and none can stand in for another.',
    },
    '22': {
      title: 'Implementing the band energy ratio in Python: which cell should 2000 Hz fall in?',
      lead: 'The formula for BER (band energy ratio) is a single division, but the code hides two traps that raise no error: mistaking the number of time frames for the number of frequency cells, and using an approximate cell spacing that puts 2000 Hz on the wrong side of the cut. This lesson computes BER frame by frame for three 30-second music clips. The correct boundary is cell 186; mistake the 1292 time frames for the number of frequency cells and the boundary moves to cell 234 — about 2519 Hz in reality. The median BER of the Debussy clip then comes out 4.37 dB higher.',
    },
    '23': {
      title: 'Spectral centroid and bandwidth: measuring where frequencies are centred and how far they spread',
      lead: 'The spectral centroid and bandwidth are often dismissed with two library calls. This lesson goes the other way: first get the time tracks of three music clips with the library’s default settings, then break the two calls down into formulas and recompute them frame by frame yourself. The largest difference is only 1.917e-05 Hz for the centroid and 1.156e-05 Hz for the bandwidth. Lining them up also exposes a definition that is easy to mix up: mean absolute distance is p = 1, but the library computes the root-mean-square distance, p = 2, by default — and on these three clips the two differ by a factor of 1.30 to 1.54.',
    },
  },
};
