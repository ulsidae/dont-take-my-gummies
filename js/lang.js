const defaultLanguage = "ko";

const selectableLanguages = new Set([
    "ko",
    "en",
    "fr"
]);


function getLanguage(){

    const saved =
        localStorage.getItem("lang");


    return selectableLanguages.has(saved)
        ? saved
        : defaultLanguage;

}



async function applyLanguage(){

    const lang =
        getLanguage();


    const response =
        await fetch(
            `public/lang/${lang}.json?time=${Date.now()}`
        );


    const data =
        await response.json();



    document.documentElement.lang =
        lang;



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

    if(!selectableLanguages.has(lang)){

        return;

    }


    localStorage.setItem(
        "lang",
        lang
    );


    await applyLanguage();

}
