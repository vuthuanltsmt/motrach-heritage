// =========================
// DI TÍCH NỔI BẬT TRANG CHỦ
// =========================

fetch("data/heritage.json")
.then(response => response.json())
.then(data => {

    const container = document.getElementById("featured-heritage");

    if (!container) return;

    data.forEach(item => {

        container.innerHTML += `

        <div class="card">

            <img src="${item.image}" alt="${item.name}">

            <div class="card-content">

                <h3>${item.name}</h3>

                <p>${item.description}</p>

                <br>

                <a href="pages/detail.html?id=${item.id}">
                    <button>Xem chi tiết</button>
                </a>

            </div>

        </div>

        `;

    });

});