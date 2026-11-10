'use strict';

(async function () {
  const section = document.getElementById('link-to-deftbrain');
  const search = section.querySelector('#embed-search');
  const target = section.querySelector('#embed-target');
  const format = section.querySelector('#embed-format');
  const theme = section.querySelector('#embed-theme');
  const preview = section.querySelector('#embed-preview');
  const code = section.querySelector('#embed-code');
  const copy = section.querySelector('#embed-copy');
  const status = section.querySelector('#embed-status');
  const home = { id: 'deftbrain', title: 'DeftBrain' };
  const origin = 'https://deftbrain.com';
  let tools = [];

  function update() {
    const item = tools.find(tool => tool.id === target.value) || home;
    const path = item === home ? '/' : '/' + encodeURIComponent(item.id);
    const link = document.createElement('a');
    link.href = origin + path;
    preview.href = path;
    theme.disabled = format.value === 'text';

    if (format.value === 'text') {
      link.textContent = item.title;
      preview.textContent = item.title;
    } else {
      const asset = '/embeds/' + encodeURIComponent(item.id) + '/' + theme.value + '.svg';
      const image = document.createElement('img');
      image.src = origin + asset;
      image.alt = item === home ? item.title : item.title + ' · DeftBrain';
      image.width = format.value === 'compact' ? 150 : 250;
      image.height = image.width * 105 / 375;
      image.referrerPolicy = 'no-referrer';
      link.append(image);
      const localImage = image.cloneNode();
      localImage.src = asset;
      preview.replaceChildren(localImage);
    }
    code.value = link.outerHTML;
    status.textContent = '';
  }

  function filterTools() {
    const selected = target.value;
    const query = search.value.trim().toLowerCase();
    target.replaceChildren(new Option('DeftBrain homepage', home.id));
    for (const tool of tools) {
      if (tool.title.toLowerCase().includes(query)) target.add(new Option(tool.title, tool.id));
    }
    target.value = Array.from(target.options).some(option => option.value === selected) ? selected : home.id;
    update();
    if (query && target.options.length === 1) status.textContent = 'No tools match that search.';
  }

  search.addEventListener('input', filterTools);
  for (const control of [target, format, theme]) control.addEventListener('change', update);
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.value);
      status.textContent = 'Copied.';
    } catch {
      code.focus();
      code.select();
      status.textContent = 'Copy the selected code.';
    }
  });
  section.querySelector('#embed-controls').hidden = false;
  update();
  try {
    const response = await fetch('/search/tools.json');
    if (!response.ok) throw new Error('Catalog unavailable');
    tools = (await response.json()).sort((a, b) => a.title.localeCompare(b.title));
    search.disabled = false;
    filterTools();
  } catch {
    status.textContent = 'The tool list is unavailable. You can still link to DeftBrain.';
  }
}());
