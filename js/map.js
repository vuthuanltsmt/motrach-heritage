let allData = [];

fetch("../data/heritage.json")

.then(r => r.json())

.then(data => {

    allData = data;

    render(data);

});

function render(data){

    const list = document.getElementById("heritage-list");

    list.innerHTML="";

    data.forEach(place=>{

        list.innerHTML += `

        <div class="heritage-card">

            <img src="../${place.image}">

            <div class="content">

                <h3>${place.name}</h3>

                <p>${place.description}</p>

                <a href="detail.html?id=${place.id}"

                class="btn">

                Xem chi tiết

                </a>

            </div>

        </div>

        `;

    });

}

document.getElementById("search")

.addEventListener("input",function(){

    const key=this.value.toLowerCase();

    const result=allData.filter(item=>

        item.name.toLowerCase().includes(key)

    );

    render(result);

});