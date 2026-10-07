const september = [
  [1979,7.05],[1980,7.67],[1981,7.14],[1982,7.30],[1983,7.39],[1984,6.81],[1985,6.70],[1986,7.41],[1987,7.28],[1988,7.37],
  [1989,7.01],[1990,6.14],[1991,6.47],[1992,7.47],[1993,6.40],[1994,7.14],[1995,6.08],[1996,7.58],[1997,6.69],[1998,6.54],
  [1999,6.12],[2000,6.25],[2001,6.73],[2002,5.83],[2003,6.12],[2004,5.98],[2005,5.50],[2006,5.86],[2007,4.27],[2008,4.69],
  [2009,5.26],[2010,4.87],[2011,4.56],[2012,3.57],[2013,5.21],[2014,5.22],[2015,4.62],[2016,4.53],[2017,4.82],[2018,4.79],
  [2019,4.36],[2020,4.00],[2021,4.95],[2022,4.90],[2023,4.38],[2024,4.35],[2025,4.75],[2026,4.81]
];
const decades = [
  { label:'1979—88', start:1979, end:1988, value:7.21, note:'1979—1988' },
  { label:'1989—98', start:1989, end:1998, value:6.75, note:'1989—1998' },
  { label:'1999—08', start:1999, end:2008, value:5.74, note:'1999—2008' },
  { label:'2009—18', start:2009, end:2018, value:4.75, note:'2009—2018' },
  { label:'2019—26', start:2019, end:2026, value:4.56, note:'2019—2026 · partial' }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function updateProgress(){
  const max = document.documentElement.scrollHeight - window.innerHeight;
  $('#progressBar').style.width = `${max ? (window.scrollY / max) * 100 : 0}%`;
}
window.addEventListener('scroll', updateProgress, { passive:true });
updateProgress();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('is-visible'); });
}, { threshold:.14 });
$$('.reveal').forEach(el => observer.observe(el));

function buildLineChart(){
  const host = $('#lineChart');
  if(!host) return;
  const width = 1100, height = 365;
  const margin = { top:18, right:22, bottom:42, left:46 };
  const min = 3.2, max = 8.0;
  const x = year => margin.left + ((year - 1979) / (2026 - 1979)) * (width - margin.left - margin.right);
  const y = value => margin.top + ((max - value) / (max - min)) * (height - margin.top - margin.bottom);
  const path = september.map(([year,value], i) => `${i ? 'L' : 'M'} ${x(year).toFixed(2)} ${y(value).toFixed(2)}`).join(' ');
  const area = `${path} L ${x(2026)} ${height-margin.bottom} L ${x(1979)} ${height-margin.bottom} Z`;
  const grid = [4,5,6,7,8].map(tick => `<line class="chart-gridline" x1="${margin.left}" x2="${width-margin.right}" y1="${y(tick)}" y2="${y(tick)}"/><text class="chart-axis-label" x="${margin.left-12}" y="${y(tick)+4}" text-anchor="end">${tick}</text>`).join('');
  const years = [1979,1990,2000,2010,2020,2026].map(year => `<text class="chart-axis-label" x="${x(year)}" y="${height-12}" text-anchor="middle">${year}</text>`).join('');
  const points = september.map(([year,value]) => `<circle class="chart-point ${year===2026?'current':''}" data-year="${year}" data-value="${value.toFixed(2)}" cx="${x(year)}" cy="${y(value)}" r="${year===2026?5:3.4}" tabindex="0" aria-label="${year}: ${value.toFixed(2)} million km²"/>`).join('');
  host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#65d8d0" stop-opacity=".38"/><stop offset="1" stop-color="#65d8d0" stop-opacity="0"/></linearGradient></defs>${grid}${years}<path class="chart-area" pathLength="1" d="${area}"/><path class="chart-line" pathLength="1" d="${path}"/>${points}</svg>`;
  const tooltip = $('#chartTooltip');
  const show = point => {
    const box = host.getBoundingClientRect();
    const card = host.parentElement.getBoundingClientRect();
    const px = (Number(point.getAttribute('cx')) / width) * box.width;
    const py = (Number(point.getAttribute('cy')) / height) * box.height;
    tooltip.style.left = `${box.left - card.left + px + 24}px`;
    tooltip.style.top = `${box.top - card.top + py + 8}px`;
    $('strong',tooltip).textContent = point.dataset.value;
    $('span',tooltip).textContent = `${point.dataset.year} · million km²`;
    tooltip.classList.add('show');
    tooltip.setAttribute('aria-hidden','false');
    $$('.chart-point', host).forEach(p => p.classList.remove('active'));
    point.classList.add('active');
  };
  const hide = () => { tooltip.classList.remove('show'); tooltip.setAttribute('aria-hidden','true'); };
  $$('.chart-point', host).forEach(point => {
    point.addEventListener('mouseenter', () => show(point));
    point.addEventListener('focus', () => show(point));
    point.addEventListener('mouseleave', hide);
    point.addEventListener('blur', hide);
  });
  const chartObserver = new IntersectionObserver(entries => {
    if(entries.some(entry => entry.isIntersecting)){
      host.classList.add('chart-visible');
      chartObserver.disconnect();
    }
  }, { threshold:.25 });
  chartObserver.observe(host);
}
buildLineChart();

function buildDecades(){
  const host = $('#decadeBars');
  if(!host) return;
  const max = 8;
  host.innerHTML = decades.map((d,i) => `<button class="decade-bar-wrap ${i===0?'selected':''}" data-index="${i}" aria-label="${d.note}: ${d.value.toFixed(2)} million km²"><span class="bar-value">${d.value.toFixed(2)}</span><span class="decade-bar" style="--bar-height:${(d.value/max)*228}px"></span><span class="bar-label">${d.label}</span></button>`).join('');
  const detail = $('#decadeDetail');
  const update = index => {
    const d = decades[index];
    $('strong',detail).textContent = d.note;
    $('b',detail).innerHTML = `${d.value.toFixed(2)} <small>million km²</small>`;
    $$('.decade-bar-wrap',host).forEach((bar,i) => bar.classList.toggle('selected',i===index));
  };
  $$('.decade-bar-wrap',host).forEach((bar,i) => bar.addEventListener('click', () => update(i)));
}
buildDecades();

const sections = $$('[data-section]');
const navLinks = $$('.site-header nav a');
const sectionMap = { minimum:'minimum', 'line-story':'line-story', decades:'decades', weather:'weather' };
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${sectionMap[entry.target.dataset.section]}`));
  });
}, { rootMargin:'-30% 0px -55% 0px', threshold:0 });
sections.forEach(section => navObserver.observe(section));
