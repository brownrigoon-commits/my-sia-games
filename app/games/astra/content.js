/* MY SIA Astra — bounded bilingual learning content, RULE v2.
 * Science references (accessed 2026-10-11):
 * https://annex.exploratorium.edu/xref/phenomena/color_mixing_%28additive%29.html
 * https://annex.exploratorium.edu/xref/exhibits/distilled_light.html
 * https://www.noaa.gov/education/resource-collections/marine-life/aquatic-food-webs
 * Filters below are IDEAL RGB-channel filters, not a claim about every real filter.
 * Food-chain arrows mean energy transfer; nutrient cycles are labelled separately.
 * No runtime dependencies, network access, state, or random answer generation.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AstraContent = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var BASE = Object.freeze({ K: 1, E1: 6, E2: 11, E3: 16 });
  var catalog = [
    { id: 'star-mail', kind: 'order', icon: '✉️', title: { ko: '별빛 우체국', en: 'Star Mail' }, description: { ko: '말과 생각을 순서대로 이어요', en: 'Arrange words and connect ideas' } },
    { id: 'cloud-bridge', kind: 'build', icon: '☁️', title: { ko: '구름 다리', en: 'Cloud Bridge' }, description: { ko: '수의 조각으로 다리를 지어요', en: 'Build a bridge with number pieces' } },
    { id: 'prism-lab', kind: 'light', icon: '🔬', title: { ko: '프리즘 연구소', en: 'Prism Lab' }, description: { ko: '빛을 겹치고 실험해요', en: 'Combine light and test ideas' } },
    { id: 'living-forest', kind: 'chain', icon: '🌿', title: { ko: '살아 있는 숲', en: 'Living Forest' }, description: { ko: '숲속 생명의 연결을 찾아요', en: 'Discover connections in nature' } }
  ];
  function pick(lang, ko, en) { return lang === 'en' ? en : ko; }
  function rotate(a, seed) { var n = a.length, k = n ? (seed % (n - 1 || 1)) + 1 : 0; return a.slice(k).concat(a.slice(0, k)); }
  function textTokens(parts, seed) { return rotate(parts.map(function (label, i) { return { id: 't' + i, label: label }; }), seed); }
  function ordered(parts, seed) { return { tokens: textTokens(parts, seed), answer: parts.map(function (_, i) { return 't' + i; }) }; }

  // Kindergarten words: Korean syllables / English letters, with no duplicate
  // pieces inside a word, so every target has one visible intended order.
  var WORDS = [
    [['해님', 'sun', '☀️'], ['모자', 'hat', '🎩'], ['버스', 'bus', '🚌']],
    [['사과', 'pear', '🍎', '🍐'], ['토끼', 'hare', '🐇'], ['오리', 'duck', '🦆']],
    [['도토리', 'acorn', '🌰'], ['무지개', 'rainbow', '🌈'], ['고구마', 'yam', '🍠']],
    [['소나무', 'pine', '🌲'], ['해바라기', 'flower', '🌻'], ['잠자리', 'insect', '🪰']],
    [['코끼리', 'zebra', '🐘', '🦓'], ['아이스크림', 'cream', '🍦'], ['카네이션', 'tulip', '🌸', '🌷']]
  ];
  // Each row is a distinct message. Vertical bars are the manipulation boundaries.
  var MAIL = {
    E1: [
      [
        ['탐사대는|씨앗 12개를|화분에 심었어요.', 'The explorers|planted 12 seeds|in pots.'],
        ['우체부는|편지 24통을|기지에 전했어요.', 'The courier|delivered 24 letters|to the base.'],
        ['관찰팀은|나무 18그루를|지도에 표시했어요.', 'The survey team|marked 18 trees|on the map.']
      ],
      [
        ['비가 오기 전에|탐사대는|상자 15개를|창고로 옮겼어요.', 'Before the rain,|the explorers|moved 15 boxes|into the storehouse.'],
        ['해가 지기 전에|관찰팀은|표지판 23개를|길가에 세웠어요.', 'Before sunset,|the survey team|placed 23 signs|beside the trail.'],
        ['배가 떠나기 전에|우체부는|소포 32개를|선실에 실었어요.', 'Before departure,|the courier|loaded 32 parcels|into the cabin.']
      ],
      [
        ['먼저|씨앗 16개를 나누고,|그다음|각 화분에 심었어요.', 'First,|we sorted 16 seeds;|then,|we planted them in pots.'],
        ['먼저|관찰 카드 21장을 읽고,|그다음|날짜별로 정리했어요.', 'First,|we read 21 observation cards;|then,|we sorted them by date.'],
        ['먼저|사진 14장을 고르고,|그다음|관찰 일지에 붙였어요.', 'First,|we chose 14 photographs;|then,|we added them to the journal.']
      ],
      [
        ['상자 28개가 젖어서|우리는|마른 천으로 닦은 뒤|선반에 놓았어요.', 'Because 28 boxes were wet,|we|dried them with a cloth|and placed them on shelves.'],
        ['길이 30cm인 가지가 부러져서|우리는|사진을 찍은 뒤|관찰 기록을 남겼어요.', 'Because a 30 cm branch broke,|we|took a photograph|and recorded the observation.'],
        ['물통 12개가 비어서|탐사대는|물을 채운 뒤|수레에 실었어요.', 'Because 12 containers were empty,|the explorers|filled them with water|and loaded the cart.']
      ],
      [
        ['편지 120통을 실었지만,|안개가 짙어져서|배는 잠시 기다렸어요.|안개가 걷힌 뒤에야|배달을 시작했어요.', 'Although 120 letters were loaded,|fog grew thick,|so the boat waited.|Only after the fog cleared|did delivery begin.'],
        ['기지까지 300m가 남았지만,|다리가 흔들려서|탐사대는 멈췄어요.|다리를 점검한 뒤에야|다시 출발했어요.', 'Although the base was only 300 m away,|the bridge shook,|so the explorers stopped.|Only after checking the bridge|did they continue.'],
        ['종이 200장을 준비했지만,|바람이 강해져서|조사를 잠시 멈췄어요.|실내로 옮긴 뒤에야|기록을 다시 시작했어요.', 'Although 200 sheets were ready,|the wind grew strong,|so the survey paused.|Only after moving indoors|did recording resume.']
      ]
    ],
    E2: [
      [
        ['초식동물의 넓은 어금니는|식물을 잘게 갈기에 알맞아요.|그래서 연구자는|이빨 모양으로 먹이를 추정해요.', 'Broad molars|are suited to grinding plants.|Therefore, researchers|use tooth shape to infer diet.'],
        ['동물의 발자국이|부드러운 진흙에 남았어요.|그 위를 퇴적물이 덮으면서|흔적이 보존될 기회가 생겼어요.', 'An animal left tracks|in soft mud.|When sediment covered them,|the traces had a chance to be preserved.'],
        ['빛을 받은 잎은|광합성으로 양분을 만들어요.|이 양분은|식물의 성장에 쓰여요.', 'Leaves receiving light|make sugars through photosynthesis.|These sugars|help the plant grow.']
      ],
      [
        ['먼저|지층에서 발견 위치를 기록했어요.|그다음|화석을 조심스럽게 꺼냈어요.|마지막으로 모양을 비교했어요.', 'First,|we recorded the fossil’s position in the rock.|Next,|we carefully removed it.|Finally, we compared its shape.'],
        ['먼저|같은 종의 씨앗을 골랐어요.|그다음|물의 양을 다르게 주었어요.|마지막으로 자란 모습을 비교했어요.', 'First,|we selected seeds of the same species.|Next,|we varied the amount of water.|Finally, we compared their growth.'],
        ['먼저|하천의 위쪽에서 물을 채취했어요.|그다음|아래쪽에서도 채취했어요.|마지막으로 두 시료를 비교했어요.', 'First,|we collected water upstream.|Next,|we collected water downstream.|Finally, we compared the two samples.']
      ],
      [
        ['퇴적물에 묻힌 생물의 흔적도|모두 화석이 되지는 않아요.|왜냐하면|보존되기 전에|썩거나 파괴될 수 있기 때문이에요.', 'Not every buried trace|becomes a fossil.|This is because|before preservation,|it may decay or be destroyed.'],
        ['잎에 생긴 작은 구멍만으로|곤충의 종류를 확정할 수는 없어요.|왜냐하면|서로 다른 곤충도|비슷한 흔적을 남기기 때문이에요.', 'Small holes in a leaf|cannot identify an insect with certainty.|This is because|different insects|can leave similar traces.'],
        ['오늘의 날씨만으로|그 지역의 기후를 알 수는 없어요.|왜냐하면|기후는|오랜 기간의 날씨 경향이기 때문이에요.', 'One day’s weather|cannot describe a region’s climate.|This is because|climate describes|weather patterns over a long period.']
      ],
      [
        ['물의 양은 같게 했지만,|한 화분만 햇빛을 덜 받았어요.|그 화분의 성장이 더뎠어요.|따라서 이번 관찰에서는|빛의 양과 성장의 관계를 살펴볼 수 있어요.', 'Both pots received equal water,|but one received less light.|That plant grew more slowly.|Therefore, this observation|helps us examine light and growth.'],
        ['두 흙에 같은 양의 물을 부었지만,|모래가 많은 흙에서 물이 더 빨리 빠졌어요.|관찰 결과는|이번에 사용한 흙에서|알갱이 구성이 물 빠짐에 관계됨을 보여 줘요.', 'We poured equal water onto two soils,|but the sandier soil drained faster.|This observation suggests|that in these samples,|grain composition affects drainage.'],
        ['같은 장소를 조사했지만,|아침과 저녁의 새 울음 수는 달랐어요.|따라서 조사 결과를 비교할 때는|장소뿐 아니라|조사 시간도 기록해야 해요.', 'We surveyed the same place,|but bird-call counts differed by time.|Therefore, when comparing surveys,|we should record both location|and the time of observation.']
      ],
      [
        ['이빨 모양은 먹이를 추정하는 단서예요.|하지만 이 단서 하나만으로는 충분하지 않아요.|그래서 연구자는|턱의 구조와 다른 흔적도 비교해요.|여러 단서가 맞을수록 추정이 더 탄탄해져요.', 'Tooth shape is a clue to diet.|However, one clue is not enough.|So researchers|also compare jaws and other traces.|Agreement among clues strengthens an inference.'],
        ['한 번의 측정에서 수온이 높았어요.|하지만 하루 내내 높았다는 뜻은 아니에요.|그래서 관찰자는|여러 시간대에 다시 측정해요.|반복한 기록으로 변화의 경향을 살펴봐요.', 'One reading showed warm water.|However, that does not describe the entire day.|So observers|measure again at different times.|Repeated records reveal patterns of change.'],
        ['어느 구역에서 싹이 적게 났어요.|하지만 원인이 물 부족이라고 단정할 수는 없어요.|그래서 조사팀은|빛과 온도와 씨앗 상태도 확인해요.|가능한 원인을 비교한 뒤 설명을 세워요.', 'Few seeds sprouted in one plot.|However, a lack of water is not the only possible cause.|So the team|also checks light, temperature, and seed condition.|They compare possible causes before explaining.']
      ]
    ],
    E3: [
      [
        ['두 시료의 겉모습은 비슷했다.|그러나 겉모습만으로 성분이 같다고 할 수 없다.|따라서 연구자는|같은 방법으로 성분을 분석한 뒤|공통점과 차이점을 판단했다.', 'The samples looked similar.|However, appearance alone cannot establish identical composition.|Therefore, the researcher|analysed both using the same method|before judging their similarities and differences.'],
        ['새의 수가 지난주보다 적게 관찰되었다.|그러나 이것만으로 실제 개체 수 감소를 단정할 수 없다.|따라서 조사팀은|관찰 시간과 날씨를 확인한 뒤|같은 조건에서 조사를 반복했다.', 'Fewer birds were observed than last week.|However, this alone cannot establish a population decline.|Therefore, the team|checked survey time and weather|and repeated the survey under matching conditions.'],
        ['화석의 일부 뼈가 발견되지 않았다.|그러나 그 동물에게 원래 없었다는 뜻은 아니다.|따라서 연구자는|보존 과정과 다른 표본을 검토한 뒤|몸의 구조를 추정했다.', 'Some bones were missing from the fossil.|However, the animal may originally have had them.|Therefore, the researcher|examined preservation and other specimens|before reconstructing its anatomy.']
      ],
      [
        ['물의 영향을 알아보려면|빛과 온도는 일정하게 유지해야 한다.|빛까지 함께 바꾸면|어떤 조건이 결과에 영향을 주었는지|따로 판단하기 어려워진다.', 'To investigate the effect of water,|light and temperature should remain constant.|If light also changes,|the effect of each condition|becomes difficult to separate.'],
        ['흙의 영향을 알아보려면|씨앗의 종류와 물의 양을 맞추어야 한다.|씨앗까지 함께 바꾸면|자란 모습의 차이가 무엇 때문인지|분명히 설명하기 어려워진다.', 'To investigate the effect of soil,|seed type and water supply should match.|If seed type also changes,|the cause of a difference in growth|becomes difficult to identify.'],
        ['단열재의 영향을 알아보려면|용기와 처음 물의 온도를 맞추어야 한다.|용기까지 함께 바꾸면|온도 변화의 원인을|단열재만으로 설명할 수 없다.', 'To investigate insulation,|containers and initial water temperatures should match.|If containers also change,|the cause of a temperature difference|cannot be attributed only to insulation.']
      ],
      [
        ['식물이 많은 곳에서 곤충도 많이 관찰되었다.|이는 두 관찰값이 함께 달라졌다는 뜻이다.|하지만 식물이 유일한 원인임을 증명하지는 않는다.|왜냐하면|온도나 습도도 영향을 주었을 수 있기 때문이다.', 'More insects were observed where plants were abundant.|This shows that two observations varied together.|But it does not prove plants were the only cause.|This is because|temperature or moisture may also have influenced them.'],
        ['복원한 습지에서 새의 종류가 늘었다.|이는 복원 뒤에 나타난 변화이다.|하지만 한 번의 비교로 모든 원인을 확정할 수는 없다.|왜냐하면|계절이나 이동 시기도 달라졌을 수 있기 때문이다.', 'More bird species were recorded after wetland restoration.|This is a change observed after restoration.|But one comparison cannot establish every cause.|This is because|season or migration timing may also have changed.'],
        ['기온이 높은 날에 전력 사용량이 많았다.|이는 두 기록 사이의 관계를 보여 준다.|하지만 기온만이 사용량을 결정하지는 않는다.|왜냐하면|사람 수나 기기 사용도 영향을 주기 때문이다.', 'Electricity use was higher on warmer days.|This shows a relationship between the records.|But temperature alone does not determine electricity use.|This is because|occupancy and appliance use also have effects.']
      ],
      [
        ['만약 빛이 씨앗 발아에 꼭 필요하다면,|어둠 속에서는 발아하지 않아야 한다.|그런데 일부 씨앗이 어둠 속에서 발아했다.|따라서 이번 종의 씨앗에 대해서는|빛이 발아의 필수 조건이라는 설명이 맞지 않는다.', 'If light were essential for germination,|no seeds would germinate in darkness.|Yet some seeds germinated in darkness.|Therefore, for this species,|the claim that light is essential does not hold.'],
        ['만약 모든 암석이 물에 가라앉는다면,|가벼운 부석도 가라앉아야 한다.|그런데 이 부석은 물에 떴다.|따라서 이 관찰은|모든 암석이 가라앉는다는 주장의 반례이다.', 'If every rock sank in water,|a piece of pumice would also sink.|Yet this pumice floated.|Therefore, this observation|is a counterexample to the claim that every rock sinks.'],
        ['만약 모든 금속이 자석에 붙는다면,|구리 조각도 붙어야 한다.|그런데 이 구리 조각은 붙지 않았다.|따라서 이 관찰은|모든 금속이 자석에 붙는다는 주장의 반례이다.', 'If every metal stuck to a magnet,|a piece of copper would also stick.|Yet this copper did not stick.|Therefore, this observation|is a counterexample to the claim that every metal sticks.']
      ],
      [
        ['반복 실험에서 같은 경향이 나타났다.|이 결과는 가설을 뒷받침한다.|그러나 실험한 조건 밖에서도 반드시 같다는 뜻은 아니다.|따라서 결론에는 실험 조건을 밝히고,|다른 조건에서는 추가 검증이 필요하다고 적는다.', 'Repeated trials showed the same pattern.|This result supports the hypothesis.|However, it does not guarantee the same result beyond the tested conditions.|Therefore, the conclusion states those conditions|and calls for testing under other conditions.'],
        ['두 측정기의 기록이 서로 달랐다.|어느 하나가 맞다고 바로 정할 수는 없다.|먼저 기준값으로 두 기기를 점검해야 한다.|그다음 같은 조건에서 다시 측정하고,|남은 차이와 측정의 한계를 함께 보고한다.', 'The instruments gave different readings.|Neither can immediately be declared correct.|First, both should be checked against a reference.|Next, measurements should be repeated under matching conditions,|and remaining differences and limitations reported.'],
        ['기존 설명과 맞지 않는 자료가 나타났다.|자료를 설명에 맞추어 버려서는 안 된다.|먼저 기록과 측정 과정을 확인해야 한다.|확인 뒤에도 차이가 남는다면,|설명을 수정하거나 새로운 가설을 검토한다.', 'New data did not match the existing explanation.|The data should not be discarded just to preserve it.|First, records and measurement methods should be checked.|If the mismatch remains after checking,|the explanation should be revised or alternatives investigated.']
      ]
    ]
  };
  function mail(band, level, lang, r) {
    if (band === 'K') {
      var word = WORDS[level - 1][r], value = word[lang === 'en' ? 1 : 0];
      return Object.assign(ordered(Array.from(value), level + r), {
        kind: 'order', emoji: lang === 'en' && word[3] ? word[3] : word[2],
        prompt: pick(lang, '그림 이름 ‘' + value + '’을 만들어요.', 'Build the picture word “' + value + '”.'),
        hint: pick(lang, '첫 조각은 ‘' + Array.from(value)[0] + '’이에요.', 'The first piece is “' + value[0] + '”.'),
        explanation: pick(lang, '‘' + Array.from(value).join(' · ') + '’을 차례로 이으면 ‘' + value + '’이 돼요.', 'The letters ' + value.split('').join(' · ') + ' in this order spell “' + value + '”.'),
        goal: pick(lang, '소리와 글자 잇기', 'Connect sounds and letters')
      });
    }
    var sentence = MAIL[band][level - 1][r][lang === 'en' ? 1 : 0], parts = sentence.split('|');
    var goal = {
      E1: [ ['누가·무엇을·어떻게', 'Who, what, and action'], ['시간과 행동', 'Time and action'], ['먼저와 그다음', 'First and next'], ['까닭과 결과', 'Cause and result'], ['상황·문제·해결', 'Situation, obstacle, resolution'] ],
      E2: [ ['사실과 연결 표현', 'Facts and connecting phrases'], ['조사 절차', 'Investigation sequence'], ['주장과 까닭', 'Claim and reason'], ['관찰과 해석', 'Observation and interpretation'], ['단서와 추론', 'Evidence and inference'] ],
      E3: [ ['증거의 한계', 'Limits of evidence'], ['변인 통제', 'Controlling variables'], ['상관과 원인', 'Association and cause'], ['가정과 반례', 'Prediction and counterexample'], ['검증과 결론', 'Testing and conclusions'] ]
    }[band][level - 1];
    var prompt = pick(lang, '문장 조각을 이어 뜻이 분명한 탐사 편지를 완성하세요.', 'Arrange the fragments into a clear exploration message.');
    // Procedural tasks explicitly give the event chronology; an upstream sample
    // does not inherently have to be collected before a downstream sample.
    if (band === 'E1' && level === 3) prompt = pick(lang,
      ['씨앗을 나눈 다음 심었어요. 그 순서대로 편지를 완성하세요.', '카드를 읽은 다음 정리했어요. 그 순서대로 편지를 완성하세요.', '사진을 고른 다음 일지에 붙였어요. 그 순서대로 편지를 완성하세요.'][r],
      ['We sorted the seeds before planting them. Arrange the message in that order.', 'We read the cards before sorting them. Arrange the message in that order.', 'We selected photographs before adding them to the journal. Arrange the message in that order.'][r]);
    if (band === 'E2' && level === 2) prompt = pick(lang,
      ['발견 위치 기록, 화석 꺼내기, 모양 비교의 순서로 조사했어요. 편지를 완성하세요.', '씨앗 고르기, 물의 양 다르게 주기, 성장 비교의 순서로 실험했어요. 편지를 완성하세요.', '위쪽 채취, 아래쪽 채취, 시료 비교의 순서로 조사했어요. 편지를 완성하세요.'][r],
      ['We recorded the location, removed the fossil, then compared its shape. Arrange that report.', 'We selected seeds, varied their water supply, then compared growth. Arrange that report.', 'We sampled upstream, sampled downstream, then compared the samples. Arrange that report.'][r]);
    return Object.assign(ordered(parts, level + r), {
      kind: 'order', prompt: prompt,
      hint: pick(lang, '‘' + parts[0] + '’부터 시작해요. 이어지는 말의 연결을 살펴보세요.', 'Start with “' + parts[0] + '” and follow the connecting words.'),
      explanation: pick(lang, '완성한 편지: ', 'Completed message: ') + parts.join(' ') + ' ' + pick(lang, '연결 표현이 사건의 순서와 생각의 관계를 알려 줘요.', 'Connecting phrases reveal the sequence and the relationship between ideas.'),
      goal: goal[lang === 'en' ? 1 : 0]
    });
  }

  function bridge(band, level, lang, r) {
    var result = { kind: 'build', countable: band === 'K', maxPieces: 12 }, target, values, expression, prompt, explanation, unit = '', labels, goal;
    function set(t, v, ex, pko, pen, eko, een, gko, gen) {
      target = t; values = v; expression = ex; prompt = pick(lang, pko, pen); explanation = pick(lang, eko, een); goal = pick(lang, gko, gen);
    }
    if (band === 'K') {
      var targets = [[3, 4, 5], [6, 8, 9], [7, 9, 10], [14, 17, 18], [11, 13, 16]], t = targets[level - 1][r];
      var kFirst = level === 3 ? [3, 4, 5][r] : level === 4 ? [12, 15, 16][r] : level === 5 ? [8, 9, 7][r] : 0;
      target = t; values = level <= 2 ? [1, 2, 3] : [1, 2, 5, 10];
      labels = values.map(function (v) { return '●'.repeat(v); });
      expression = level <= 2 ? '●'.repeat(t) : '●'.repeat(kFirst) + '   ' + '○'.repeat(t - kFirst);
      prompt = pick(lang, level <= 2 ? '점만큼 다리 돌을 놓아요.' : level === 3 ? '두 무리의 점을 함께 세어 다리를 놓아요.' : level === 4 ? '빈 점도 채워 다리를 이어요.' : '열 칸을 채우고 남은 점도 이어 봐요.', level <= 2 ? 'Place bridge stones to match the dots.' : level === 3 ? 'Count both groups and build the bridge.' : level === 4 ? 'Fill the empty dots to finish the bridge.' : 'Fill ten spaces, then add the remaining dots.');
      explanation = pick(lang, '점을 하나씩 짚어 세면 모두 ' + t + '개예요. 큰 조각도 작은 점들이 모인 것이에요.', 'Count every dot: there are ' + t + '. Each larger piece is a group of smaller dots.');
      goal = pick(lang, ['다섯까지 세기', '열까지 세기', '두 무리 모아 세기', '열을 넘지 않고 채우기', '열 묶음 만들기'][level - 1], ['Count to five', 'Count to ten', 'Count two groups', 'Complete a group without crossing ten', 'Make a group of ten'][level - 1]);
      result.targetObjects = t; result.groups = level <= 2 ? [t] : [kFirst, t - kFirst]; result.tenFrame = level === 5;
    } else if (band === 'E1') {
      if (level === 1) { var a = [27, 36, 48][r], b = [15, 27, 24][r]; set(a + b, [1, 10, 20], a + ' + ' + b, '두 수의 합만큼 다리를 지으세요.', 'Build the bridge to the sum.', '일의 자리에서 열 개가 모이면 십의 자리 한 묶음으로 바꿔요. ' + a + ' + ' + b + ' = ' + (a + b) + '예요.', 'Regroup ten ones as one ten. ' + a + ' + ' + b + ' = ' + (a + b) + '.', '십과 일, 받아올림', 'Tens, ones, and regrouping'); }
      if (level === 2) { var a = [52, 73, 61][r], b = [28, 46, 37][r]; set(a - b, [1, 5, 10], a + ' − ' + b, '남은 수만큼 다리 길이를 맞추세요.', 'Match the bridge to the amount left.', '십 한 묶음을 일 열 개로 바꾼 뒤 빼요. ' + a + ' − ' + b + ' = ' + (a - b) + '예요.', 'Exchange one ten for ten ones before subtracting. ' + a + ' − ' + b + ' = ' + (a - b) + '.', '받아내림 뺄셈', 'Subtraction with regrouping'); }
      if (level === 3) { var n = [4, 5, 3][r], groups = [3, 4, 6][r]; set(n * groups, [n, 2, 10], Array(groups).fill(n).join(' + '), '같은 크기의 묶음을 모두 이으세요.', 'Join all the equal groups.', n + '씩 ' + groups + '묶음을 이어 세면 ' + n * groups + '이에요. 같은 수를 여러 번 더할 수 있어요.', groups + ' groups of ' + n + ' make ' + n * groups + '. Equal groups can be added repeatedly.', '같은 수 여러 번 더하기', 'Repeated addition'); }
      if (level === 4) { var a = [230, 170, 320][r], b = [150, 260, 140][r]; unit = pick(lang, '원', ' won'); set(a + b, [10, 50, 100, 500], a + ' + ' + b, '두 물건의 값을 동전으로 정확히 내세요.', 'Pay the exact total for both items.', '두 값을 더하면 ' + (a + b) + '원이에요. 100원과 50원, 10원을 묶어 같은 금액을 만들어요.', 'The prices total ' + (a + b) + ' won. Combine coin values to pay exactly.', '두 가격과 동전', 'Two prices and coins'); }
      if (level === 5) { var price = [670, 580, 740][r]; unit = pick(lang, '원', ' won'); set(1000 - price, [10, 50, 100, 500], '1,000 − ' + price, '1,000원을 냈어요. 거스름돈을 만드세요.', 'You paid 1,000 won. Build the change.', '낸 돈에서 값을 빼요. 1,000 − ' + price + ' = ' + (1000 - price) + '원이므로 이것이 거스름돈이에요.', 'Subtract the price from the payment. 1,000 − ' + price + ' = ' + (1000 - price) + ' won in change.', '1,000원에서 거스름돈', 'Change from 1,000 won'); }
    } else if (band === 'E2') {
      if (level === 1) { var targets = [5400, 700, 2400], ex = ['900 × 6', '2,800 ÷ 4', '600 × 4']; set(targets[r], [100, 500, 1000], ex[r], '계산 결과만큼 에너지 다리를 지으세요.', 'Build an energy bridge equal to the result.', ex[r] + ' = ' + targets[r] + '이에요. 백 단위 묶음으로 곱하거나 똑같이 나눠 생각해요.', ex[r] + ' = ' + targets[r] + '. Multiply or divide using groups of hundreds.', '큰 수의 곱셈과 나눗셈', 'Multiplication and exact division'); }
      if (level === 2) { var a = [3670, 5200, 4860][r], b = [2580, 2780, 1670][r], plus = r !== 1; var t = plus ? a + b : a - b; set(t, [10, 100, 1000, 2000], a + (plus ? ' + ' : ' − ') + b, '받아올림이나 받아내림을 살펴 계산하세요.', 'Calculate carefully, regrouping where needed.', '같은 자리끼리 계산하고 열 묶음은 다음 자리로 옮겨요. 결과는 ' + t + '이에요.', 'Calculate matching place values and regroup groups of ten. The result is ' + t + '.', '네 자리 수의 계산', 'Regrouping with four-digit numbers'); }
      if (level === 3) { var fractions = [[3, 2, 8], [7, -3, 9], [2, 3, 7]], f = fractions[r]; var t = f[0] + f[1]; set(t, [1, 2, 3], f[0] + '/' + f[2] + (f[1] > 0 ? ' + ' : ' − ') + Math.abs(f[1]) + '/' + f[2], '같은 크기의 분수 조각으로 결과를 만드세요.', 'Build the result using equal fraction pieces.', '분모가 같으므로 조각의 크기는 같아요. 분자끼리 계산하면 ' + t + '/' + f[2] + '이에요.', 'The denominators match, so the pieces have equal size. Combining the numerators gives ' + t + '/' + f[2] + '.', '같은 분모의 분수', 'Fractions with the same denominator'); labels = values.map(function (v) { return v + '/' + f[2]; }); result.denominator = f[2]; result.displayTarget = t + '/' + f[2]; }
      if (level === 4) { var price = [6750, 4820, 7360][r]; unit = pick(lang, '원', ' won'); set(10000 - price, [10, 50, 100, 500, 1000, 2000], '10,000 − ' + price, '10,000원을 내고 받을 거스름돈을 만드세요.', 'Build the change from a 10,000 won payment.', '10,000원에서 물건값 ' + price + '원을 빼면 ' + (10000 - price) + '원이에요.', 'Subtract the price of ' + price + ' from 10,000 to get ' + (10000 - price) + ' won.', '10,000원 거스름돈', 'Change from 10,000 won'); }
      if (level === 5) { var t = [2100, 1800, 1350][r], ex = ['600 × 4 − 300', '3,600 ÷ 3 + 600', '450 × 4 − 450'][r]; set(t, [50, 100, 500, 1000], ex, pick(lang, '', '') + ['한 상자에 600개씩 4상자에서 300개를 보냈어요. 남은 수를 만드세요.', '3,600개를 3팀에 똑같이 나누고 한 팀에 600개를 더 줬어요. 그 팀의 수는?', '450개씩 4묶음 중 450개를 사용했어요. 남은 수를 만드세요.'][r], ['Four boxes held 600 each. After sending 300, how many remain?', 'Share 3,600 equally among three teams, then give one team 600 more. Its total?', 'Four groups held 450 each. After using 450, how many remain?'][r], '먼저 곱셈이나 나눗셈으로 묶음의 수를 구한 뒤 더하거나 빼요. ' + ex + ' = ' + t + '이에요.', 'First multiply or divide to find the grouped quantity, then add or subtract. ' + ex + ' = ' + t + '.', '두 단계 문제', 'Two-step problems'); }
    } else {
      if (level === 1) { var ex = ['1.25 + 0.60', '3/4 of 68', '2.40 − 0.75'][r], t = [185, 51, 165][r]; set(t, r === 1 ? [1, 5, 10, 20] : [5, 10, 25, 50, 100], ex, r === 1 ? '68의 3/4만큼 다리를 지으세요.' : '소수의 자릿값을 맞추어 다리를 지으세요.', r === 1 ? 'Build a bridge equal to three quarters of 68.' : 'Align the decimal place values and build the result.', r === 1 ? '68을 똑같이 4묶음으로 나누면 한 묶음은 17이에요. 그중 3묶음은 51이에요.' : '소수점 자리를 맞춰 계산해요. 결과는 ' + (t / 100).toFixed(2) + '예요.', r === 1 ? 'Each quarter of 68 is 17. Three quarters are three groups of 17, giving 51.' : 'Align the decimal places. The result is ' + (t / 100).toFixed(2) + '.', '소수와 분수만큼의 양', 'Decimals and fractions of quantities'); if (r !== 1) { labels = values.map(function (v) { return (v / 100).toFixed(2); }); result.displayTarget = (t / 100).toFixed(2); result.scale = 100; } else { expression = pick(lang, '68의 3/4', ex); } }
      if (level === 2) { var t = [5, 3, 6][r], den = [6, 8, 5][r], ex = ['1/2 + 1/3', '3/4 × 1/2', '2/5 × 3'][r]; set(t, [1, 2, 3], ex, '분수 조각으로 계산 결과를 나타내세요.', 'Represent the result using fraction pieces.', ['1/2은 3/6, 1/3은 2/6이에요. 크기가 같은 조각으로 바꾸면 합은 5/6이에요.', '3/4의 절반은 3/8이에요. 분자끼리, 분모끼리 곱해도 같은 결과가 나와요.', '2/5를 3번 모으면 6/5예요. 1보다 큰 분수도 다리로 나타낼 수 있어요.'][r], ['One half is 3/6 and one third is 2/6. Using equal pieces gives 5/6.', 'Half of three quarters is 3/8. Multiplying numerators and denominators gives the same result.', 'Three groups of 2/5 make 6/5. A fraction greater than one can also form a bridge.'][r], '분수의 연산', 'Fraction operations'); labels = values.map(function (v) { return v + '/' + den; }); result.denominator = den; result.displayTarget = t + '/' + den; }
      if (level === 3) { var ex = ['200 × 25%', '800 − 800 × 20%', '360 × 50%'][r], t = [50, 640, 180][r]; set(t, [10, 20, 50, 100, 200], ex, ['200의 25%만큼 다리를 지으세요.', '800원 물건을 20% 할인해요. 판매 가격을 만드세요.', '360의 50%만큼 다리를 지으세요.'][r], ['Build a bridge for 25% of 200.', 'An 800 won item is discounted by 20%. Build its sale price.', 'Build a bridge for 50% of 360.'][r], ['25%는 1/4이므로 200의 25%는 50이에요.', '20% 할인액은 160원이에요. 800원에서 빼면 판매 가격은 640원이에요.', '50%는 절반이므로 360의 50%는 180이에요.'][r], ['25% is one quarter, so 25% of 200 is 50.', 'The 20% discount is 160 won. Subtracting it from 800 gives a sale price of 640 won.', '50% is one half, so 50% of 360 is 180.'][r], '백분율과 할인', 'Percentages and discounts'); }
      if (level === 4) { var t = [24, 42, 30][r], ex = [pick(lang, '40을 2 : 3으로 나누기', 'Share 40 in the ratio 2 : 3'), '12 × 7 ÷ 2', '6 × 5'][r]; set(t, [1, 2, 5, 10, 20], ex, ['40m를 2 : 3으로 나눌 때 큰 몫은 몇 m인가요?', '밑변 12cm, 높이 7cm인 직각삼각형의 넓이는 몇 cm²인가요?', '가로 6m, 세로 5m인 직사각형의 넓이는 몇 m²인가요?'][r], ['Share 40 m in the ratio 2 : 3. How many metres is the larger share?', 'A right triangle has base 12 cm and height 7 cm. What is its area in cm²?', 'A rectangle is 6 m by 5 m. What is its area in m²?'][r], ['전체는 같은 크기 5몫이에요. 한 몫은 8m이므로 큰 쪽 3몫은 24m예요.', '같은 밑변과 높이의 직사각형 넓이 84cm²의 절반이므로 42cm²예요.', '직사각형은 가로와 세로를 곱해요. 6 × 5 = 30m²예요.'][r], ['There are five equal parts. Each is 8 m, so the larger three-part share is 24 m.', 'The matching rectangle has area 84 cm². The right triangle is half, or 42 cm².', 'Multiply length by width: 6 × 5 = 30 m².'][r], '비와 넓이', 'Ratios and area'); unit = r === 0 ? ' m' : r === 1 ? ' cm²' : ' m²'; }
      if (level === 5) { var t = [24, 72, 45][r], ex = ['(18 + 24 + 30) ÷ 3', '120 × 3/4 − 18', '(30 + 40 + 50 + 60) ÷ 4'][r]; set(t, [1, 5, 10, 20, 50], ex, ['18, 24, 30의 평균을 다리로 나타내세요.', '120L의 3/4를 채운 뒤 18L를 썼어요. 남은 양을 만드세요.', '30, 40, 50, 60의 평균을 다리로 나타내세요.'][r], ['Build the average of 18, 24, and 30.', 'Fill a tank with three quarters of 120 L, then use 18 L. Build the amount left.', 'Build the average of 30, 40, 50, and 60.'][r], ['합계 72를 값의 개수 3으로 나누면 평균은 24예요.', '120L의 3/4는 90L예요. 여기에서 18L를 빼면 72L가 남아요.', '합계 180을 값의 개수 4로 나누면 평균은 45예요.'][r], ['The total is 72. Divide by the three values to get an average of 24.', 'Three quarters of 120 L is 90 L. Subtract 18 L to leave 72 L.', 'The total is 180. Divide by the four values to get an average of 45.'][r], '평균과 두 단계 풀이', 'Averages and two-step reasoning'); }
    }
    result.target = target; result.targetLabel = (result.displayTarget || String(target)) + unit;
    result.expression = expression; result.prompt = prompt; result.explanation = explanation; result.goal = goal;
    result.pieces = values.map(function (v, i) { return { id: 'p' + i, label: labels ? labels[i] : String(v) + unit, value: v }; });
    // Bounded dynamic programming produces a real solution even when the largest
    // piece greedily chosen would not work. The UI permits repeated pieces.
    var solutions = Array(target + 1).fill(null); solutions[0] = [];
    for (var sum = 1; sum <= target; sum++) result.pieces.forEach(function (p) {
      if (sum >= p.value && solutions[sum - p.value] && (!solutions[sum] || solutions[sum - p.value].length + 1 < solutions[sum].length)) solutions[sum] = solutions[sum - p.value].concat(p.id);
    });
    result.answer = solutions[target];
    if (!result.answer || result.answer.length > 12) throw new Error('Unbuildable bridge: ' + band + level + ':' + r);
    var first = result.pieces.filter(function (p) { return p.id === result.answer[0]; })[0];
    result.hint = pick(lang, '‘' + first.label + '’ 조각으로 시작해 볼 수 있어요. 남은 양을 생각해요.', 'One solution starts with a “' + first.label + '” piece. Think about the amount still needed.');
    return result;
  }

  var COLORS = {
    red: ['빨강', 'red', '#ff0000', 4], green: ['초록', 'green', '#00ff00', 2], blue: ['파랑', 'blue', '#0000ff', 1],
    yellow: ['노랑', 'yellow', '#ffff00', 6], cyan: ['청록', 'cyan', '#00ffff', 3], magenta: ['자홍', 'magenta', '#ff00ff', 5],
    white: ['하양', 'white', '#ffffff', 7], black: ['빛 없음', 'no light', '#000000', 0]
  };
  function colorName(key, lang) { return COLORS[key][lang === 'en' ? 1 : 0]; }
  function maskKey(mask) { return Object.keys(COLORS).filter(function (key) { return COLORS[key][3] === mask; })[0]; }
  function light(band, level, lang, r) {
    var rgb = ['red', 'green', 'blue'], mask, filter, prompt, hint, explanation, goal;
    var names = function (ids) { return ids.map(function (id) { return colorName(id, lang); }).join(pick(lang, '·', ' + ')); };
    if (band === 'K') {
      var kMasks = [[4, 2, 1], [1, 4, 2], [6, 3, 5], [3, 5, 6], [5, 6, 3]];
      mask = kMasks[level - 1][r];
      var targetName = colorName(maskKey(mask), lang);
      prompt = level <= 2 ? pick(lang, targetName + ' 빛을 켜 보아요.', 'Turn on the ' + targetName + ' light.') : pick(lang, '빛 두 개를 겹쳐 ' + targetName + '을 만들어요.', 'Overlap two lights to make ' + targetName + '.');
      goal = pick(lang, ['빛 색 알아보기', '빛 하나 골라 켜기', '두 빛 겹쳐 보기', '겹친 빛 비교하기', '두 빛 조합 찾기'][level - 1], ['Recognize light colors', 'Select a single light', 'Overlap two lights', 'Compare overlapping light', 'Find a pair of lights'][level - 1]);
    } else if (band === 'E1') {
      var eMasks = [[6, 3, 5], [5, 6, 3], [7, 6, 5], [3, 5, 6], [7, 3, 6]];
      mask = eMasks[level - 1][r];
      var targetName = colorName(maskKey(mask), lang), missing = rgb.filter(function (id) { return !(COLORS[id][3] & mask); });
      prompt = pick(lang, ['빛을 겹쳐 ' + targetName + '을 만드세요. 필요한 스위치만 켜세요.', targetName + ' 빛을 만드는 두 광원을 찾으세요.', targetName + ' 목표를 만들려면 어떤 광원을 함께 켜야 할까요?', '하양 빛에서 ' + names(missing) + ' 광원을 끈 결과를 만드세요.', '목표는 ' + targetName + '입니다. 필요한 광원만 남기세요.'][level - 1], ['Overlap lights to make ' + targetName + '. Turn on only the needed sources.', 'Find the two sources that make ' + targetName + ' light.', 'Which sources must overlap to produce ' + targetName + '?', 'Recreate white light with the ' + names(missing) + ' source switched off.', 'The target is ' + targetName + '. Keep only the required sources on.'][level - 1]);
      goal = pick(lang, ['빛의 덧셈', '두 광원의 조합', '세 광원과 하양', '광원 빼고 예측하기', '빛의 성분 찾기'][level - 1], ['Additive light mixing', 'Pairs of light sources', 'Three sources and white', 'Predict after removing a source', 'Identify light components'][level - 1]);
    } else if (band === 'E2') {
      var sourceSets = [[7, 7, 7], [6, 3, 5], [3, 5, 6], [4, 2, 1], [6, 3, 5]];
      var filterSets = [['red', 'green', 'blue'], ['green', 'blue', 'red'], ['red', 'green', 'blue'], ['blue', 'red', 'green'], ['red', 'green', 'blue']];
      mask = sourceSets[level - 1][r]; filter = filterSets[level - 1][r];
      var filtered = mask & COLORS[filter][3], sourceKey = maskKey(mask);
      var filterName = colorName(filter, lang), out = colorName(maskKey(filtered), lang);
      prompt = pick(lang, '광원은 ' + colorName(sourceKey, lang) + ' 빛이 되게 켜고, ' + filterName + ' 필터를 고르세요. 이 모형은 필터와 같은 RGB 성분만 통과시켜요. 결과: ' + out + '.', 'Set the sources to make ' + colorName(sourceKey, lang) + ' light and select the ' + filterName + ' filter. This ideal filter passes only its matching RGB component. Result: ' + out + '.');
      if (level === 5) prompt = pick(lang, '광원은 ' + colorName(sourceKey, lang) + ' 빛으로 맞추세요. 그중 ' + filterName + ' 성분만 남기는 필터를 찾아요. 투명 필터는 모든 성분을 통과시켜요.', 'Set sources to ' + colorName(sourceKey, lang) + '. Find the filter that leaves only the ' + filterName + ' component. A clear filter passes all components.');
      goal = pick(lang, ['필터가 통과시키는 빛', '혼합 빛의 성분 거르기', '없는 성분은 통과하지 않기', '빛의 흡수와 어둠', '결과로 필터 추론하기'][level - 1], ['Transmission through a filter', 'Filter mixed light', 'A missing component cannot pass', 'Absorption and darkness', 'Infer a filter from the result'][level - 1]);
    } else {
      var e3Masks = [[6, 3, 5], [7, 7, 7], [5, 6, 3], [3, 5, 6], [6, 3, 5]];
      var e3Filters = [['green', 'blue', 'red'], ['red', 'green', 'blue'], ['red', 'green', 'blue'], ['red', 'green', 'blue'], ['red', 'green', 'blue']];
      mask = e3Masks[level - 1][r]; filter = e3Filters[level - 1][r];
      var kept = colorName(filter, lang), source = colorName(maskKey(mask), lang), missingId = rgb.filter(function (id) { return !(COLORS[id][3] & mask); })[0];
      var missingName = missingId ? colorName(missingId, lang) : '', otherId = rgb.filter(function (id) { return id !== filter && (COLORS[id][3] & mask); })[0];
      var out = colorName(maskKey(mask & COLORS[filter][3]), lang);
      var evidenceKo = [
        '통제 실험: 필터는 ' + kept + '으로 고정해요. 입력은 ' + source + '이어야 해요. 두 조건을 모두 만족시키세요.',
        '통제 실험: 세 광원은 모두 켜 두세요. 출력에서 ' + kept + ' 성분만 남기는 이상적 필터를 고르세요.',
        '추론: 입력에 ' + missingName + ' 성분은 없고 나머지 두 성분은 있어요. 필터 뒤에는 ' + kept + '만 남아요. 입력과 필터를 재현하세요.',
        '추론: 입력은 ' + source + '이에요. 투명 필터가 아닌 필터를 써서 빛이 전혀 통과하지 않게 하세요. 어떤 성분이 입력에 없나요?',
        '두 관찰을 연결하세요. 투명 필터일 때 입력은 ' + source + '이고, 색 필터로 바꾸면 ' + kept + '만 보여요. 입력을 유지하고 색 필터를 찾으세요.'
      ];
      var evidenceEn = [
        'Controlled trial: keep a ' + kept + ' filter fixed. The input must be ' + source + '. Satisfy both conditions.',
        'Controlled trial: keep all three sources on. Select the ideal filter that leaves only the ' + kept + ' component.',
        'Deduce: the input lacks ' + missingName + ' but contains both other components. Only ' + kept + ' survives filtering. Reconstruct the input and filter.',
        'Deduce: the input is ' + source + '. Choose a colored filter that transmits no light. Which component is missing from the input?',
        'Connect two observations. With a clear filter, the input is ' + source + '. After changing to a colored filter, only ' + kept + ' appears. Keep the input and find that filter.'
      ];
      prompt = pick(lang, evidenceKo[level - 1], evidenceEn[level - 1]);
      goal = pick(lang, ['조건을 통제한 실험', '독립 변인과 통제 변인', '입력과 출력으로 추론', '빛이 없는 결과의 해석', '두 관찰을 이용한 역추론'][level - 1], ['A controlled experiment', 'Changed and controlled variables', 'Infer from input and output', 'Explain a dark output', 'Deduce from two observations'][level - 1]);
    }
    var answer = rgb.filter(function (id) { return !!(mask & COLORS[id][3]); }), output = filter ? mask & COLORS[filter][3] : mask, targetKey = maskKey(output);
    hint = pick(lang, '먼저 ' + colorName(answer[0], lang) + ' 광원을 켜 보세요.' + (filter ? ' 광원 조건과 필터 조건을 따로 확인해요.' : ' 다른 빛이 필요한지도 살펴봐요.'), 'Start with the ' + colorName(answer[0], lang) + ' source.' + (filter ? ' Check the source and filter conditions separately.' : ' Consider whether another light is needed.'));
    explanation = filter ? pick(lang, names(answer) + ' 광원의 합은 ' + colorName(maskKey(mask), lang) + ' 빛이에요. 이 이상적 ' + colorName(filter, lang) + ' 필터는 같은 RGB 성분만 통과시키고 나머지는 흡수해요. 따라서 출력은 ' + colorName(targetKey, lang) + '이에요. 입력에 없는 빛을 필터가 만들지는 않아요.', 'The ' + names(answer) + ' sources combine to make ' + colorName(maskKey(mask), lang) + ' light. This ideal ' + colorName(filter, lang) + ' filter passes only its matching RGB component and absorbs the rest, producing ' + colorName(targetKey, lang) + '. A filter cannot create a missing component.') : pick(lang, names(answer) + ' 빛을 켜면 ' + colorName(targetKey, lang) + ' 빛이 보여요. 빛은 겹칠수록 성분이 더해져요. 빨강·초록·파랑을 모두 겹치면 하양이 돼요.', 'The ' + names(answer) + ' sources produce ' + colorName(targetKey, lang) + ' light. Overlapping light adds components. Red, green, and blue together produce white.');
    var result = { kind: 'light', switches: rgb.map(function (id) { return { id: id, label: colorName(id, lang) }; }), answer: answer, targetColor: COLORS[targetKey][2], targetLabel: colorName(targetKey, lang), prompt: prompt, hint: hint, explanation: explanation, goal: goal };
    if (filter) { result.filterAnswer = filter; result.filterChoices = ['clear'].concat(rgb).map(function (id) { return { id: id, label: id === 'clear' ? pick(lang, '투명', 'clear') : colorName(id, lang) }; }); }
    return result;
  }

  var NATURE = {
    sun: ['햇빛', 'sunlight', '☀️'], leaf: ['풀', 'grass', '🌿'], tree: ['나무', 'tree', '🌳'], flower: ['꽃', 'flower', '🌼'],
    rabbit: ['토끼', 'rabbit', '🐇'], fox: ['여우', 'fox', '🦊'], hawk: ['매', 'hawk', '🦅'], owl: ['올빼미', 'owl', '🦉'],
    mouse: ['들쥐', 'field mouse', '🐁'], seed: ['풀씨', 'grass seeds', '🌾'], snail: ['달팽이', 'snail', '🐌'],
    caterpillar: ['애벌레', 'caterpillar', '🐛'], bird: ['곤충을 먹는 새', 'insect-eating bird', '🐦'],
    grasshopper: ['메뚜기', 'grasshopper', '🦗'], frog: ['개구리', 'frog', '🐸'], snake: ['뱀', 'snake', '🐍'],
    algae: ['조류', 'algae', '🟢'], waterflea: ['물벼룩', 'water flea', '🦐'], fish: ['작은 물고기', 'small fish', '🐟'],
    heron: ['왜가리', 'heron', '🦢'], nectar: ['꽃의 꿀', 'flower nectar', '🌸'], bee: ['벌', 'bee', '🐝'],
    nest: ['새 둥지', 'bird nest', '🪺'], pond: ['연못', 'pond', '💧'], squirrel: ['다람쥐', 'squirrel', '🐿️'], acorn: ['도토리', 'acorn', '🌰'],
    fallen: ['죽은 잎', 'dead leaves', '🍂'], deadalgae: ['죽은 조류', 'dead algae', '🟤'], deadwood: ['죽은 나무', 'dead wood', '🪵'],
    fungi: ['분해하는 균류', 'decomposer fungi', '🍄'], microbes: ['분해하는 미생물', 'decomposer microbes', '🔬'],
    nutrients: ['흙 속 무기 양분', 'soil mineral nutrients', '🟫'], waternutrients: ['물속 무기 양분', 'dissolved mineral nutrients', '💧'],
    roots: ['뿌리의 양분 흡수', 'nutrient uptake by roots', '🌱'], newleaf: ['새 잎의 성장', 'new leaf growth', '🌱']
  };
  function natureToken(id, lang) { var n = NATURE[id]; return { id: id, label: n[lang === 'en' ? 1 : 0], icon: n[2] }; }
  function forest(band, level, lang, r) {
    var path, extras = [], prompt, explanation, goal, custom;
    if (band === 'K') {
      var pairs = [
        [['sun', 'leaf'], ['sun', 'tree'], ['sun', 'flower']],
        [['leaf', 'rabbit'], ['acorn', 'squirrel'], ['nectar', 'bee']],
        [['bird', 'nest'], ['frog', 'pond'], ['squirrel', 'tree']],
        [['seed', 'mouse'], ['leaf', 'snail'], ['leaf', 'caterpillar']],
        [['caterpillar', 'bird'], ['grasshopper', 'frog'], ['fish', 'heron']]
      ];
      path = pairs[level - 1][r];
      extras = level === 1 ? [] : level < 4 ? [r === 0 ? 'fish' : 'fox'] : ['sun', 'acorn'].filter(function (id) { return path.indexOf(id) < 0; });
      if (level === 1) { prompt = pick(lang, '햇빛에서 자라는 식물로 이어요.', 'Connect sunlight to the growing plant.'); explanation = pick(lang, '식물은 햇빛을 받아 자라는 데 필요한 양분을 만들어요.', 'Plants use sunlight to make food that helps them grow.'); }
      else if (level === 3) { prompt = pick(lang, '동물에서 그 동물이 사는 곳으로 이어요.', 'Connect the animal to a place it lives.'); explanation = pick(lang, ['새는 둥지에서 알을 낳고 새끼를 길러요. 둥지는 새끼를 기르는 보금자리예요.', '많은 개구리는 연못이나 물가에서 살아요. 물은 알과 올챙이가 자라는 데에도 필요해요.', '다람쥐는 나무를 오르며 먹이를 찾고 나무의 구멍 등을 보금자리로 쓰기도 해요.'][r], ['Birds lay eggs and raise chicks in nests. A nest shelters their growing young.', 'Many frogs live in or near ponds. Water also provides a place for eggs and tadpoles to develop.', 'Squirrels climb trees to find food and may use tree cavities for shelter.'][r]); }
      else { prompt = pick(lang, '먹이에서 그것을 먹는 동물로 이어요.', 'Connect food to the animal that eats it.'); explanation = pick(lang, '먹이인 ‘' + natureToken(path[0], lang).label + '’에서 먹는 동물 ‘' + natureToken(path[1], lang).label + '’에게 에너지가 전해져요. 먹이는 움직이고 자라는 데 필요해요.', 'A ' + natureToken(path[1], lang).label + ' can eat ' + natureToken(path[0], lang).label + '. Food supplies energy for movement and growth.'); }
      goal = pick(lang, ['햇빛과 식물', '동물의 먹이', '동물의 보금자리', '식물과 먹는 동물', '동물 사이 먹이 연결'][level - 1], ['Sunlight and plants', 'Animal food', 'Habitats and shelters', 'Plants and their eaters', 'Feeding links between animals'][level - 1]);
    } else if (band === 'E1') {
      var paths = [
        [['leaf', 'rabbit', 'fox'], ['seed', 'mouse', 'owl'], ['leaf', 'caterpillar', 'bird']],
        [['leaf', 'grasshopper', 'frog'], ['algae', 'waterflea', 'fish'], ['seed', 'mouse', 'snake']],
        [['sun', 'leaf', 'rabbit'], ['sun', 'algae', 'waterflea'], ['sun', 'tree', 'caterpillar']],
        [['caterpillar', 'bird', 'hawk'], ['grasshopper', 'frog', 'snake'], ['waterflea', 'fish', 'heron']],
        [['leaf', 'rabbit', 'fox'], ['seed', 'mouse', 'owl'], ['leaf', 'grasshopper', 'frog']]
      ];
      path = paths[level - 1][r]; extras = level === 1 ? [] : ['nectar', 'acorn', 'sun'].filter(function (id) { return path.indexOf(id) < 0; }).slice(0, level === 5 ? 2 : 1);
      var route = path.map(function (id) { return natureToken(id, lang).label; });
      prompt = pick(lang, '3장의 카드를 먹이의 에너지가 전해지는 순서로 이으세요. 시작은 ‘' + route[0] + '’이에요.', 'Connect 3 cards in the direction energy moves through food. Start with “' + route[0] + '”.');
      if (level === 5) prompt = pick(lang, '이 모형에서 ' + route[2] + '는 ' + route[1] + '를 먹고, ' + route[1] + '는 ' + route[0] + '를 먹어요. 에너지의 출발점부터 3장을 이으세요.', 'In this model, the ' + route[2] + ' eats the ' + route[1] + ', which eats ' + route[0] + '. Connect 3 cards from the energy source.');
      explanation = pick(lang, route.join(' → ') + ' 순서로 에너지가 전해져요. 화살표는 먹는 동물이 먹이에서 에너지를 얻는 방향이에요.', 'Energy moves from ' + route.join(' → ') + '. The arrows point from a food source to the organism obtaining energy from it.');
      goal = pick(lang, ['먹이 사슬 3단계', '물과 땅의 먹이 사슬', '햇빛에서 시작하는 에너지', '먹는 동물도 먹이가 돼요', '관계 설명으로 사슬 찾기'][level - 1], ['Three-link food chains', 'Aquatic and land food chains', 'Energy begins with sunlight', 'A consumer can also be prey', 'Build a chain from relationships'][level - 1]);
    } else if (band === 'E2') {
      var paths = [
        [['sun', 'leaf', 'rabbit', 'fox'], ['sun', 'seed', 'mouse', 'owl'], ['sun', 'algae', 'waterflea', 'fish']],
        [['leaf', 'grasshopper', 'frog', 'snake'], ['leaf', 'caterpillar', 'bird', 'hawk'], ['algae', 'waterflea', 'fish', 'heron']],
        [['fallen', 'fungi', 'nutrients', 'roots'], ['deadalgae', 'microbes', 'waternutrients', 'algae'], ['deadwood', 'fungi', 'nutrients', 'roots']],
        [['sun', 'leaf', 'grasshopper', 'frog'], ['sun', 'tree', 'caterpillar', 'bird'], ['sun', 'algae', 'waterflea', 'fish']],
        [['fallen', 'microbes', 'nutrients', 'roots'], ['deadwood', 'fungi', 'nutrients', 'roots'], ['deadalgae', 'microbes', 'waternutrients', 'algae']]
      ];
      path = paths[level - 1][r]; extras = [level === 3 || level === 5 ? 'sun' : 'fungi', 'nectar'];
      var route = path.map(function (id) { return natureToken(id, lang).label; });
      var cycle = level === 3 || level === 5;
      prompt = cycle ? pick(lang, '죽은 생물에서 시작해 분해와 무기 양분의 재이용 과정 4단계를 이으세요. 화살표는 물질의 이동이에요.', 'Start with dead material and connect 4 stages of decomposition and nutrient reuse. Arrows show movement of matter.') : pick(lang, '‘' + route[0] + '’에서 시작해 먹이 에너지의 이동 4단계를 만드세요. 이 모형에서 마지막은 ‘' + route[3] + '’이에요.', 'Build 4 stages of food-energy transfer, starting with “' + route[0] + '” and ending with “' + route[3] + '”.');
      explanation = cycle ? pick(lang, route.join(' → ') + '. 분해자는 죽은 물질을 분해해 무기 양분이 다시 이용될 수 있게 해요. 물질은 순환하지만 에너지가 같은 고리로 순환하는 것은 아니에요.', route.join(' → ') + '. Decomposers break down dead material, making mineral nutrients available again. Matter cycles; energy does not recycle around this loop.') : pick(lang, route.join(' → ') + '. 에너지는 생산자에서 소비자로 이동해요. 일부는 생명 활동에 쓰이고 열로 흩어지므로 다음 단계에 모두 전해지지는 않아요.', route.join(' → ') + '. Energy moves from producers to consumers. Some is used in life processes and dissipates as heat, so not all reaches the next step.');
      goal = pick(lang, ['에너지 이동 4단계', '생산자와 소비자', '분해와 물질 순환', '전달되는 에너지의 한계', '무기 양분의 재이용'][level - 1], ['Four-stage energy transfer', 'Producers and consumers', 'Decomposition and matter cycling', 'Limits of energy transfer', 'Reusing mineral nutrients'][level - 1]);
    } else {
      // Explicit conditional models avoid presenting food-web predictions as
      // universal facts; other diets, migration, and feedback can change outcomes.
      var modelRows = [
        [
          [['토끼 감소', '여우의 먹이 감소', '여우의 번식 감소', '여우 수 감소'], ['fewer rabbits', 'less food for foxes', 'lower fox reproduction', 'fewer foxes']],
          [['곤충 감소', '새의 먹이 감소', '새의 번식 감소', '새 수 감소'], ['fewer insects', 'less food for birds', 'lower bird reproduction', 'fewer birds']],
          [['작은 물고기 감소', '왜가리 먹이 감소', '왜가리 번식 감소', '왜가리 수 감소'], ['fewer small fish', 'less food for herons', 'lower heron reproduction', 'fewer herons']]
        ],
        [
          [['여우 감소', '토끼가 덜 잡아먹힘', '토끼 증가', '풀을 더 많이 먹음', '풀 감소'], ['fewer foxes', 'less predation on rabbits', 'more rabbits', 'more grazing', 'less grass']],
          [['올빼미 감소', '들쥐가 덜 잡아먹힘', '들쥐 증가', '풀씨를 더 많이 먹음', '남은 풀씨 감소'], ['fewer owls', 'less predation on mice', 'more mice', 'more seed consumption', 'fewer seeds remaining']],
          [['개구리 감소', '메뚜기가 덜 잡아먹힘', '메뚜기 증가', '풀을 더 많이 먹음', '풀 감소'], ['fewer frogs', 'less predation on grasshoppers', 'more grasshoppers', 'more grazing', 'less grass']]
        ],
        [
          [['풀이 가뭄으로 감소', '토끼 먹이 감소', '토끼 감소', '여우 먹이 감소', '여우 번식 감소'], ['drought reduces grass', 'less food for rabbits', 'fewer rabbits', 'less food for foxes', 'lower fox reproduction']],
          [['조류 감소', '물벼룩 먹이 감소', '물벼룩 감소', '작은 물고기 먹이 감소', '작은 물고기 번식 감소'], ['fewer algae', 'less food for water fleas', 'fewer water fleas', 'less food for small fish', 'lower small-fish reproduction']],
          [['풀씨 감소', '들쥐 먹이 감소', '들쥐 감소', '올빼미 먹이 감소', '올빼미 번식 감소'], ['fewer grass seeds', 'less food for mice', 'fewer mice', 'less food for owls', 'lower owl reproduction']]
        ],
        null,
        [
          [['나뭇잎 감소', '애벌레 감소', '새의 곤충 먹이 감소', '새가 열매를 더 먹음', '남은 열매 감소'], ['fewer leaves', 'fewer caterpillars', 'less insect food for birds', 'birds eat more berries', 'fewer berries remaining']],
          [['들쥐 감소', '여우의 들쥐 먹이 감소', '여우가 토끼를 더 사냥', '토끼 감소', '풀을 먹는 양 감소'], ['fewer field mice', 'less mouse prey for foxes', 'foxes hunt more rabbits', 'fewer rabbits', 'less grazing']],
          [['작은 물고기 감소', '왜가리의 물고기 먹이 감소', '왜가리가 개구리를 더 사냥', '개구리 감소', '곤충을 먹는 양 감소'], ['fewer small fish', 'less fish prey for herons', 'herons hunt more frogs', 'fewer frogs', 'less insect consumption']]
        ]
      ];
      if (level === 4) {
        path = [['fallen', 'fungi', 'nutrients', 'roots', 'newleaf'], ['deadwood', 'microbes', 'nutrients', 'roots', 'newleaf'], ['deadalgae', 'microbes', 'waternutrients', 'algae', 'waterflea']][r]; extras = ['sun'];
        prompt = pick(lang, '죽은 물질부터 시작해 무기 양분이 생물에게 다시 이용되는 경로 5단계를 만드세요. 햇빛은 이 물질 경로의 카드가 아니에요.', 'Build 5 stages from dead material to nutrient reuse by living organisms. Sunlight is not a card in this matter pathway.');
        explanation = pick(lang, '분해된 물질의 무기 양분은 생산자에게 흡수되어 다시 생물체의 물질이 될 수 있어요. 식물과 조류가 성장하려면 이 양분뿐 아니라 빛에서 얻는 에너지도 필요해요. 물질의 순환과 에너지의 흐름을 구별해요.', 'Mineral nutrients released by decomposition can be taken up by producers and become living material again. Plant and algal growth also needs energy from light. Distinguish cycling matter from flowing energy.');
      } else {
        var parts = modelRows[level - 1][r][lang === 'en' ? 1 : 0];
        custom = parts.map(function (label, i) { return { id: 'event' + i, label: label, icon: ['🌿', '🔎', '🐾', '🌱', '🌍'][i] }; }); path = custom.map(function (x) { return x.id; });
        var assumptionKo = level === 5 ? ['이 모형의 새는 곤충과 열매를 먹고, 곤충이 줄면 열매를 더 먹어요.', '이 모형의 여우는 들쥐와 토끼를 먹고, 들쥐가 줄면 토끼를 더 사냥해요.', '이 모형의 왜가리는 물고기와 개구리를 먹고, 물고기가 줄면 개구리를 더 사냥해요.'][r] : '이 모형에서는 다른 먹이와 이동은 없고, 나머지 조건은 일정해요.';
        var assumptionEn = level === 5 ? ['In this model, birds eat insects and berries; when insects decline, they eat more berries.', 'In this model, foxes eat mice and rabbits; when mice decline, they hunt more rabbits.', 'In this model, herons eat fish and frogs; when fish decline, they hunt more frogs.'][r] : 'In this model, no alternative food or migration is available, and other conditions remain constant.';
        prompt = pick(lang, assumptionKo + ' ‘' + parts[0] + '’에서 시작하는 변화의 원인과 결과를 순서대로 이으세요.', assumptionEn + ' Order causes and effects, starting with “' + parts[0] + '”.');
        explanation = pick(lang, parts.join(' → ') + '. 이것은 주어진 조건에서의 예상이에요. 실제 먹이 그물에서는 다른 먹이, 이동, 시간 지연 때문에 결과가 달라질 수 있어요.', parts.join(' → ') + '. This is a prediction under the stated conditions. Real food webs can respond differently because of alternative food, movement, and time delays.');
      }
      goal = pick(lang, ['먹이 부족의 연쇄 영향', '포식자의 간접 영향', '생산자 변화의 파급', '물질 순환과 에너지 구별', '대체 먹이가 있는 먹이 그물'][level - 1], ['Consequences of food shortage', 'Indirect effects of predators', 'Effects of producer changes', 'Matter cycling versus energy flow', 'Food webs with alternative prey'][level - 1]);
    }
    var tokens = custom || path.concat(extras).map(function (id) { return natureToken(id, lang); });
    return { kind: 'chain', tokens: rotate(tokens, level + r), answer: path.slice(), prompt: prompt, explanation: explanation, goal: goal,
      hint: pick(lang, '첫 카드는 ‘' + tokens[0].label + '’이에요. 화살표가 뜻하는 방향을 생각해요.', 'The first card is “' + tokens[0].label + '”. Follow the stated meaning of the arrows.') };
  }

  function makeRound(game, band, level, lang, round) {
    band = String(band || 'K').toUpperCase();
    if (!Object.prototype.hasOwnProperty.call(BASE, band)) band = 'K';
    level = Math.max(1, Math.min(5, Math.floor(Number(level) || 1)));
    lang = lang === 'en' ? 'en' : 'ko';
    var r = ((Math.floor(Number(round) || 0) % 3) + 3) % 3;
    var builders = { 'star-mail': mail, 'cloud-bridge': bridge, 'prism-lab': light, 'living-forest': forest };
    if (!builders[game]) throw new Error('Unknown Astra game: ' + game);
    return Object.assign({ id: game + '-' + band + '-' + level + '-' + r, band: band, level: level, d: BASE[band] + level - 1, lang: lang, round: r }, builders[game](band, level, lang, r));
  }
  return { catalog: catalog, makeRound: makeRound, BASE: BASE };
});
