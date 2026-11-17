/* お問い合わせの送信 2026-11-17 うぇぶこ
   送り先＝今の AWS（CloudFront /api/* → API Gateway → Lambda）：POST /api/contact・JSON・キー名は厳密に
   selectedOption＝「一般的なお問い合わせ」「商品に関するお問い合わせ」「OEMに関するお問い合わせ」「採用に関するお問い合わせ」のどれか（一字一句このまま）
   取材・撮影協力＝一般的なお問い合わせ＋本文の先頭に【取材・撮影協力】（Lambda を触らずに済む）
   実送信は www.nomura-leathercraft.com のときだけ。見本（github.io ほか）では完了表示の見た目だけ */
(function () {
  var f = document.getElementById('contactForm'); if (!f) return;
  var en = f.dataset.lang === 'en', LIVE = location.hostname === 'www.nomura-leathercraft.com';
  var MAP = {
    oem: ['OEMに関するお問い合わせ', ''], collab: ['OEMに関するお問い合わせ', '【コラボレーション】'], item: ['商品に関するお問い合わせ', ''],
    press: ['一般的なお問い合わせ', '【取材・撮影協力】'], recruit: ['採用に関するお問い合わせ', ''], other: ['一般的なお問い合わせ', '']
  };
  var T = en ? {
    req: 'Please fill in the required fields.', mail: 'Please check your email address.', agree: 'Please agree to the privacy policy.', sending: 'Sending…',
    fail: 'Sorry, we could not send your message. Please email us at info@nomura-leathercraft.com or call +81-3-3837-2314.',
    done: 'Thank you. We have received your inquiry and sent you a confirmation email.', demo: '(This preview page does not actually send messages.)'
  } : {
    req: '必須の項目をご記入ください。', mail: 'メールアドレスをご確認ください。', agree: 'プライバシーポリシーへの同意にチェックを入れてください。', sending: '送信しています…',
    fail: '送信できませんでした。お手数ですがお電話（03-3837-2314）かメール（info@nomura-leathercraft.com）でご連絡ください。',
    done: 'お問い合わせを受け付けました。確認のメールをお送りしました。', demo: '（この確認用ページからは送信されません）'
  };
  var msg = f.querySelector('.form-msg'), btn = f.querySelector('button[type=submit]'), label = btn.textContent, done = f.nextElementSibling;
  /* ※ name="item" は使わない（form.elements.item はメソッド名と重なり値が取れない） */
  function v(n) { var e = f.elements[n]; return e ? String(e.value || '').trim() : ''; }
  function show(t) { msg.textContent = t; msg.hidden = false; }
  f.addEventListener('submit', function (e) {
    e.preventDefault(); if (btn.disabled) return; msg.hidden = true;
    var bad = [].slice.call(f.querySelectorAll('[required]')).filter(function (x) { return x.type === 'checkbox' ? !x.checked : !String(x.value).trim(); });
    if (bad.length) { show(bad.length === 1 && bad[0].name === 'agree' ? T.agree : T.req); bad[0].focus(); return; }
    if (f.elements.email && !f.elements.email.checkValidity()) { show(T.mail); f.elements.email.focus(); return; }
    var type, pre = '', extra = [];
    if (en) {
      type = v('type'); extra = [['Country', v('country')], ['Product', v('product')], ['Quantity', v('qty')], ['Timeline', v('when')]];
    } else {
      var k = (f.querySelector('input[name=type]:checked') || {}).value || 'other'; if (!MAP[k]) k = 'other';
      type = MAP[k][0]; pre = MAP[k][1];
      if (f.classList.contains('is-oem')) extra = [['作りたいもの', v('product')], ['数量の目安', v('qty')], ['希望の時期', v('when')]];
    }
    var lines = extra.filter(function (x) { return x[1]; }).map(function (x) { return en ? x[0] + ': ' + x[1] : '【' + x[0] + '】' + x[1]; });
    var body = {
      userCompany: v('company'), userName: v('name'), userKana: en ? v('name') : v('kana'), userEmail: v('email'), userPhone: v('phone'),
      userQuestion: (pre ? pre + '\n' : '') + (lines.length ? lines.join('\n') + '\n\n' : '') + v('message'), selectedOption: type
    };
    btn.disabled = true; btn.textContent = T.sending;
    var send = LIVE
      ? fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { if (!r.ok) throw new Error(r.status); })
      : new Promise(function (ok) { setTimeout(ok, 500); });
    send.then(function () {
      f.hidden = true; done.innerHTML = '<b>' + T.done + '</b>' + (LIVE ? '' : '<p>' + T.demo + '</p>'); done.hidden = false; done.focus();
      done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(function () { show(T.fail); btn.disabled = false; btn.textContent = label; });
  });
})();
