async function applyLanguage(){


const lang =
localStorage.getItem("lang")
||
"en";


const res =
await fetch(
`public/lang/${lang}.json?${Date.now()}`
);


const data =
await res.json();



document
.querySelectorAll("[data-lang]")
.forEach(el=>{


let key =
el.dataset.lang;


if(data[key])
el.innerHTML=data[key];


});


}
