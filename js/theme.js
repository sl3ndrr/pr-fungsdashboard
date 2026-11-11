import {withTransition, motion} from './motion.js';
import {updateFilterIndicator} from './ui.js';

export function initialiseTheme() {
const THEME_VALUES = ['light', 'system', 'dark'];
let requestedTheme='system';
const THEME_LABELS = {
  light: 'Helles Design',
  system: 'Folgt der Systemeinstellung',
  dark: 'Dunkles Design',
};

const themeSwitch = document.getElementById('theme-switch');
const themeOptions = [...themeSwitch.querySelectorAll('.theme-option')];
const themeStatus = document.getElementById('theme-switch-status');

function applyTheme(theme, { focus = false } = {}) {
  const selectedTheme = THEME_VALUES.includes(theme) ? theme : 'system';

  if (selectedTheme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', selectedTheme);
  }

  themeSwitch.dataset.value = selectedTheme;
  themeStatus.textContent = THEME_LABELS[selectedTheme];
  themeOptions.forEach((option) => {
    const isSelected = option.dataset.themeValue === selectedTheme;
    option.setAttribute('aria-checked', String(isSelected));
    option.tabIndex = isSelected ? 0 : -1;
  });

  try {
    localStorage.setItem('theme_pref', selectedTheme);
  } catch {
    // Das Farbschema bleibt auch ohne verfügbaren Speicher bedienbar.
  }

  updateFilterIndicator(themeSwitch);

  if (focus) {
    themeOptions.find((option) => option.dataset.themeValue === selectedTheme)?.focus();
  }
}

themeOptions.forEach((option) => {
  option.addEventListener('click', () => changeTheme(option.dataset.themeValue));
});

themeSwitch.addEventListener('keydown', (event) => {
  const currentIndex = Math.max(0, THEME_VALUES.indexOf(requestedTheme));
  let nextIndex;

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = (currentIndex + 1) % THEME_VALUES.length;
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = (currentIndex - 1 + THEME_VALUES.length) % THEME_VALUES.length;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = THEME_VALUES.length - 1;
  } else {
    return;
  }

  event.preventDefault();
  changeTheme(THEME_VALUES[nextIndex], { focus: true });
});

function changeTheme(theme, options = {}) {
  const rect = themeOptions.find(option => option.getAttribute('aria-checked') === 'true').getBoundingClientRect();
  withTransition(() => {
    applyTheme(theme, options);
    const icon = themeOptions.find(option => option.dataset.themeValue === theme)?.querySelector('svg');
    motion(icon, [{rotate:'-15deg',scale:'.8'}, {rotate:'0deg',scale:'1'}], {speed:'fast'});
  }, {type:'theme', origin:{x:rect.left+rect.width/2,y:rect.top+rect.height/2}});
  requestedTheme=theme;
}
let savedTheme = 'system';
try {
  savedTheme = localStorage.getItem('theme_pref') || 'system';
} catch {
  // Bei gesperrtem Speicher mit der Systemeinstellung starten.
}
applyTheme(savedTheme);
requestedTheme=themeSwitch.dataset.value;
}
