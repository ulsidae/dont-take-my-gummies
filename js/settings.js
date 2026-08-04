const defaultLanguage = "ko";
const selectableLanguages = new Set(["en", "ko"]);

function selectedLanguage(){
    const saved = localStorage.getItem("lang");
    return selectableLanguages.has(saved) ? saved : defaultLanguage;
}

async function loadLanguage(){
    const lang = selectedLanguage();
    const response = await fetch(`public/lang/${lang}.json?time=${Date.now()}`);
    const data = await response.json();

    document.documentElement.lang = lang;
    document.querySelectorAll("[data-lang]").forEach(element=>{
        const key = element.dataset.lang;
        if(data[key]) element.textContent = data[key];
    });
}

async function changeLanguage(lang){
    if(!selectableLanguages.has(lang)) return;

    localStorage.setItem("lang", lang);
    await loadLanguage();
}

function disableComingSoonLanguages(){
    document.querySelectorAll('[data-language-option="fr"]').forEach(button=>{
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
    });
}

function initVolume(){
    const slider = document.getElementById("volume");
    const value = document.getElementById("volumeValue");
    const saved = localStorage.getItem("volume") || 100;

    slider.value = saved;
    value.textContent = saved;

    slider.addEventListener("input", ()=>{
        localStorage.setItem("volume", slider.value);
        value.textContent = slider.value;
    });
}

document.addEventListener("DOMContentLoaded", async()=>{
    await loadLanguage();
    disableComingSoonLanguages();
    initVolume();
});
