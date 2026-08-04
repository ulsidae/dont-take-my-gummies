function initLanguage(){

    const selector =
        document.getElementById("language");


    if (!selector) return;


    const saved =
        localStorage.getItem("lang")
        || "ko";


    selector.value =
        saved;


    selector.addEventListener(
        "change",
        ()=>{

            localStorage.setItem(
                "lang",
                selector.value
            );


            location.reload();

        }
    );

}



function initVolume(){

    const slider =
        document.getElementById("volume");


    const value =
        document.getElementById("volumeValue");



    const saved =
        localStorage.getItem("volume")
        || 100;



    slider.value =
        saved;


    value.textContent =
        saved;



    slider.addEventListener(
        "input",
        ()=>{

            localStorage.setItem(
                "volume",
                slider.value
            );


            value.textContent =
                slider.value;

        }
    );

}



document.addEventListener(
"DOMContentLoaded",
async()=>{

    await applyLanguage();

    initLanguage();   // 추가

    initVolume();

});
