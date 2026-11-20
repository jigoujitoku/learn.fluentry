/**
 * Japanese Conjugation Engine for Verbs & Adjectives
 * Vjerna reprodukcija Iznimke.java i Verb.java logike
 */
class JapaneseConjugator {
  static conjugate(wordObj, form) {
    if (!wordObj || !wordObj.reading) return '';
    const v = wordObj.reading;
    const g = wordObj.group;

    // --- 1. PRIDJEVI ---
    if (g === 'i-adj' || g === 'i-adj-irregular') {
      const isIrr = g === 'i-adj-irregular' || v === 'いい' || v.endsWith('がいい');
      const stem = isIrr ? v.slice(0, -2) + 'よ' : v.slice(0, -1);

      // Pristojni oblici (Polite Forms - desu)
      if (form === 'masu') return v + 'です';
      if (form === 'masu_neg') return stem + 'くないです';
      if (form === 'masu_past') return stem + 'かったです';
      if (form === 'masu_past_neg') return stem + 'くなかったです';

      // Kratki oblici (Short Forms)
      if (form === 'short') return v;
      if (form === 'nai') return stem + 'くない';
      if (form === 'ta') return stem + 'かった';
      if (form === 'past_negative' || form === 'short_past_neg') return stem + 'くなかった';

      // Vezni i izvedeni oblici
      if (form === 'te') return stem + 'くて';
      if (form === 'negative_te') return stem + 'くなくて';
      if (form === 'adverb') return stem + 'く';
      if (form === 'naru') return stem + 'くなりました';
      if (form === 'suru') return stem + 'くします';
      if (form === 'sou_seems') return isIrr ? 'よさそうです' : stem + 'そうです';
      if (form === 'sou_hear') return v + 'そうです';
      if (form === 'sugiru') return stem + 'すぎる';
    }

    if (g === 'na-adj') {
      const map = {
        masu: 'です',
        masu_neg: 'じゃないです',
        masu_past: 'でした',
        masu_past_neg: 'じゃなかったです',
        short: 'だ',
        nai: 'じゃない',
        ta: 'だった',
        past_negative: 'じゃなかった',
        short_past_neg: 'じゃなかった',
        te: 'で',
        negative_te: 'じゃなくて',
        adverb: 'に',
        naru: 'になりました',
        suru: 'にします',
        sou_seems: 'そうです',
        sou_hear: 'だそうです',
        sugiru: 'すぎる'
      };
      return v + (map[form] || '');
    }

    // --- 2. GLAGOLI ---
    if (form === 'short') return v;

    const shift = {
      i: {'う':'い','つ':'ち','る':'り','む':'み','ぶ':'び','ぬ':'に','く':'き','ぐ':'ぎ','す':'し'},
      a: {'う':'わ','つ':'た','る':'ら','む':'ま','ぶ':'ば','ぬ':'な','く':'か','ぐ':'が','す':'さ'},
      e: {'う':'え','つ':'て','る':'れ','む':'め','ぶ':'べ','ぬ':'ね','く':'け','ぐ':'げ','す':'せ'},
      o: {'う':'お','つ':'と','る':'ろ','む':'も','ぶ':'ぼ','ぬ':'の','く':'こ','ぐ':'ご','す':'そ'}
    };

    const isSuru = g === 'irregular-suru' || v.endsWith('する');
    const isKuru = g === 'irregular-kuru' || v.endsWith('くる');
    const isIchi = g === 'ichidan';
    const last = v.slice(-1), stem = v.slice(0, -1), base2 = v.slice(0, -2);
    const honorifics = ['いらっしゃる', 'おっしゃる', 'なさる', 'くださる', 'ござる'];

    if (form === 'masu' || form === 'masu_neg' || form === 'masu_past' || form === 'masu_past_neg') {
      let mStem = stem + (shift.i[last] || '');
      if (honorifics.includes(v)) mStem = v.slice(0, -1) + 'い';
      else if (isSuru) mStem = base2 + 'し';
      else if (isKuru) mStem = base2 + 'き';
      else if (isIchi) mStem = stem;

      if (form === 'masu') return mStem + 'ます';
      if (form === 'masu_neg') return mStem + 'ません';
      if (form === 'masu_past') return mStem + 'ました';
      if (form === 'masu_past_neg') return mStem + 'ませんでした';
    }

    if (form === 'nai' || form === 'short_past_neg') {
      const tail = form === 'nai' ? 'ない' : 'なかった';
      if (v === 'ある') return tail;
      return isSuru ? base2 + 'し' + tail : isKuru ? base2 + 'こ' + tail : isIchi ? stem + tail : stem + (shift.a[last]||'') + tail;
    }

    if (form === 'te' || form === 'ta' || form === 'kudasai') {
      const isTe = form === 'te' || form === 'kudasai';
      const ext = form === 'kudasai' ? 'ください' : '';
      let res = '';
      if (isSuru) res = base2 + (isTe ? 'して' : 'した');
      else if (isKuru) res = base2 + (isTe ? 'きて' : 'きた');
      else if (isIchi) res = stem + (isTe ? 'て' : 'た');
      else if (v === 'いく' || v === '行く' || v.endsWith('いく') || v.endsWith('行く')) res = base2 + (isTe ? 'いって' : 'いった');
      else {
        if (['う','つ','る'].includes(last)) res = stem + (isTe ? 'った' : 'った');
        else if (['む','ぶ','ぬ'].includes(last)) res = stem + (isTe ? 'んで' : 'んだ');
        else if (last === 'く') res = stem + (isTe ? 'いて' : 'いた');
        else if (last === 'ぐ') res = stem + (isTe ? 'いで' : 'いだ');
        else if (last === 'す') res = stem + (isTe ? 'して' : 'した');
      }
      return res + ext;
    }

    if (form === 'negative_te') return (v === 'ある') ? 'なくて' : isSuru ? base2 + 'しなくて' : isKuru ? base2 + 'こなくて' : isIchi ? stem + 'なくて' : stem + (shift.a[last]||'') + 'なくて';
    if (form === 'tai') return isSuru ? base2 + 'したい' : isKuru ? base2 + 'きたい' : isIchi ? stem + 'たい' : stem + (shift.i[last]||'') + 'たい';
    if (form === 'potential') return isSuru ? base2 + 'できる' : isKuru ? base2 + 'こられる' : isIchi ? stem + 'られる' : stem + (shift.e[last]||'') + 'る';
    if (form === 'passive') return isSuru ? base2 + 'される' : isKuru ? base2 + 'こられる' : isIchi ? stem + 'られる' : stem + (shift.a[last]||'') + 'れる';
    if (form === 'causative') return isSuru ? base2 + 'させる' : isKuru ? base2 + 'こさせる' : isIchi ? stem + 'させる' : stem + (shift.a[last]||'') + 'せる';
    if (form === 'volitional') return isSuru ? base2 + 'しよう' : isKuru ? base2 + 'こよう' : isIchi ? stem + 'よう' : stem + (shift.o[last]||'') + 'う';
    if (form === 'sugiru') return isSuru ? base2 + 'しすぎる' : isKuru ? base2 + 'きすぎる' : isIchi ? stem + 'すぎる' : stem + (shift.i[last]||'') + 'すぎる';

    return v;
  }
}