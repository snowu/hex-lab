/* Local syntax highlighting; editing, selection and accessibility stay native. */
(function () {
  const grammar = language => window.Prism?.languages[language];
  // Preserve source whitespace, including nonbreaking spaces in string literals.
  function encode(tokens) {
    if (typeof tokens === 'string') return tokens.replace(/[&<>]/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[char]));
    if (Array.isArray(tokens)) return tokens.map(encode);
    return new Prism.Token(tokens.type, encode(tokens.content), tokens.alias);
  }
  const html = (text, language) => Prism.Token.stringify(encode(Prism.tokenize(text, grammar(language))), language);

  function highlight(root, language) {
    if (!grammar(language)) return;
    for (const code of root.querySelectorAll('pre[data-native-code] > code')) {
      code.className = 'language-' + language;
      code.innerHTML = html(code.textContent, language);
    }
  }

  function editor(textarea, language) {
    if (!grammar(language)) return {
      setValue(value) { textarea.value = value; },
      destroy() {},
    };
    const wrapper = document.createElement('div');
    wrapper.className = 'native-editor';
    wrapper.dataset.language = language;
    const render = document.createElement('pre');
    render.className = 'native-code-render';
    render.setAttribute('aria-hidden', 'true');
    const code = document.createElement('code');
    code.className = 'language-' + language;
    render.append(code);
    textarea.before(wrapper);
    wrapper.append(render, textarea);
    const originalWrap = textarea.getAttribute('wrap');
    textarea.setAttribute('wrap', 'off');

    function scroll() {
      render.scrollTop = textarea.scrollTop;
      render.scrollLeft = textarea.scrollLeft;
    }
    function resize() {
      const style = getComputedStyle(textarea);
      for (const property of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'tabSize']) {
        render.style[property] = style[property];
      }
      render.style.borderWidth = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].join(' ');
      render.style.width = textarea.clientWidth + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth) + 'px';
      render.style.height = textarea.clientHeight + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth) + 'px';
      scroll();
    }
    function paint() {
      // The extra newline keeps the final empty line and scroll range visible.
      code.innerHTML = html(textarea.value + '\n', language);
      scroll();
    }
    textarea.addEventListener('input', paint);
    textarea.addEventListener('scroll', scroll);
    const observer = new ResizeObserver(resize);
    observer.observe(textarea);
    resize();
    paint();
    return {
      setValue(value) {
        textarea.value = value;
        textarea.scrollTop = textarea.scrollLeft = 0;
        paint();
      },
      destroy() {
        observer.disconnect();
        textarea.removeEventListener('input', paint);
        textarea.removeEventListener('scroll', scroll);
        if (originalWrap === null) textarea.removeAttribute('wrap');
        else textarea.setAttribute('wrap', originalWrap);
        wrapper.replaceWith(textarea);
      },
    };
  }
  window.NativeCode = {highlight, editor};
})();
