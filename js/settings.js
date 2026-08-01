async function loadLanguage(){

    const lang =
    localStorage.getItem("lang")
    || "en";


    const response =
    await fetch(
        `public/lang/${lang}.json?time=${Date.now()}`
    );


    const data =
    await response.json();



    document
    .querySelectorAll("[data-lang]")
    .forEach(element=>{


        const key =
        element.dataset.lang;


        if(data[key]){

            element.textContent =
            data[key];

        }

    });


}



async function changeLanguage(lang){

    localStorage.setItem(
        "lang",
        lang
    );


    await loadLanguage();

}





function initVolume(){


    const slider =
    document.getElementById("volume");


    const value =
    document.getElementById("volumeValue");



    const saved =
    localStorage.getItem("volume")
    || 100;



    slider.value=saved;

    value.textContent=saved;



    slider.addEventListener(
    "input",
    ()=>{


        localStorage.setItem(
            "volume",
            slider.value
        );


        value.textContent =
        slider.value;


    });


}





document.addEventListener(
"DOMContentLoaded",
async()=>{


    await loadLanguage();


    initVolume();


});
