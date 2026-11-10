'use strict';

(async function () {
  const section = document.getElementById('link-to-deftbrain');
  const target = section.querySelector('#embed-target');
  const theme = section.querySelector('#embed-theme');
  const preview = section.querySelector('#embed-preview');
  const copy = section.querySelector('#embed-copy');
  const status = section.querySelector('#embed-status');
  const home = { id: 'deftbrain', title: 'DeftBrain' };
  const origin = 'https://deftbrain.com';
  let tools = [];
  let embedCode = '';

  function update() {
    const item = tools.find(tool => tool.id === target.value) || home;
    const format = section.querySelector('[name=embed-format]:checked').value;
    const path = item === home ? '/' : '/' + encodeURIComponent(item.id);
    const link = document.createElement('a');
    link.href = origin + path;
    preview.href = path;
    theme.disabled = format === 'text';

    if (format === 'text') {
      link.textContent = item.title;
      preview.textContent = item.title;
    } else {
      const asset = '/embeds/' + encodeURIComponent(item.id) + '/' + theme.querySelector(':checked').value + '.svg?v=2';
      const image = document.createElement('img');
      image.src = origin + asset;
      image.alt = item === home ? item.title : item.title + ' · DeftBrain';
      image.width = format === 'compact' ? 150 : 250;
      image.height = image.width * 105 / 375;
      image.referrerPolicy = 'no-referrer';
      link.append(image);
      const localImage = image.cloneNode();
      localImage.src = asset;
      preview.replaceChildren(localImage);
    }
    embedCode = link.outerHTML;
    status.textContent = '';
  }

  target.addEventListener('change', update);
  for (const control of section.querySelectorAll('[name=embed-format], [name=embed-theme]')) {
    control.addEventListener('change', update);
  }
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      status.textContent = 'Copied.';
    } catch {
      status.textContent = 'Clipboard access is unavailable. Allow it in your browser and try again.';
    }
  });
  section.querySelector('#embed-controls').hidden = false;
  update();
  try {
    const response = await fetch('/search/tools.json');
    if (!response.ok) throw new Error('Catalog unavailable');
    tools = (await response.json()).sort((a, b) => a.title.localeCompare(b.title));
    for (const tool of tools) target.add(new Option(tool.title, tool.id));
  } catch {
    status.textContent = 'The tool list is unavailable. You can still link to DeftBrain.';
  }
}());
