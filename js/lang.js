async function applyLanguage(){


const savedLanguage =
localStorage.getItem("lang");



const lang =
savedLanguage === "en"
||
savedLanguage === "ko"
? savedLanguage
: "ko";


const res =
await fetch(
`public/lang/${lang}.json?${Date.now()}`
);


const data =
await res.json();



document.documentElement.lang=lang;



document
.querySelectorAll("[data-lang]")
.forEach(el=>{


let key =
el.dataset.lang;


if(data[key])
el.innerHTML=data[key];


});


}
