const defaultLanguage = "ko";

async function loadLanguage(lang){
  try{
    const response = await fetch(`public/lang/${lang}.json`);
    const data = await response.json();

    document.querySelectorAll("[data-lang]").forEach(element=>{
      const key = element.dataset.lang;
      if(data[key]) element.innerHTML = data[key];
    });
  }
  catch(error){
    console.error("Language load failed", error);
  }
}

function resizeMenu(){
  const ratio = window.innerWidth / window.innerHeight;
  document.documentElement.style.setProperty("--screen-ratio", ratio);
}

window.addEventListener("resize", resizeMenu);
window.addEventListener("orientationchange", resizeMenu);

window.onload=()=>{
  let lang = localStorage.getItem("lang") || defaultLanguage;
  if(lang !== "en" && lang !== "ko") lang = defaultLanguage;

  loadLanguage(lang);
  document.documentElement.lang = lang;
  resizeMenu();
};
