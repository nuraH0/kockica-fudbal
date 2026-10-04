import { db } from "./firebase.js";

import {
    ref,
    push,
    onValue,
    remove,
    update
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";


document.addEventListener("DOMContentLoaded", () => {

    const terminiRef = ref(db, "termini");

    let sviTermini = {};

    let odabraniDatum = null;


    /* =====================================================
       POMOĆNE FUNKCIJE
    ===================================================== */

    function vrijemeUMinutama(vrijeme) {

        const [sati, minute] =
            vrijeme.split(":").map(Number);

        return sati * 60 + minute;
    }


    function vrijemeJeIspravno(vrijeme) {

        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
            vrijeme
        );

    }


    /*
     * 01.10.2026.
     *      ↓
     * 2026-10-01
     */
    function datumZaFirebase(datum) {

        if (!datum) return null;

        const cisto =
            datum.trim().replace(/\.$/, "");

        const dijelovi =
            cisto.split(".");

        if (dijelovi.length !== 3) {
            return null;
        }

        const dan = dijelovi[0];
        const mjesec = dijelovi[1];
        const godina = dijelovi[2];


        if (
            !/^\d{2}$/.test(dan) ||
            !/^\d{2}$/.test(mjesec) ||
            !/^\d{4}$/.test(godina)
        ) {
            return null;
        }


        const date = new Date(
            Number(godina),
            Number(mjesec) - 1,
            Number(dan)
        );


        if (
            date.getFullYear() !== Number(godina) ||
            date.getMonth() !== Number(mjesec) - 1 ||
            date.getDate() !== Number(dan)
        ) {
            return null;
        }


        return `${godina}-${mjesec}-${dan}`;
    }


    /*
     * 2026-10-01
     *      ↓
     * 01.10.2026.
     */
    function formatDatumZaPrikaz(datum) {

        if (!datum) return "";

        const dijelovi =
            datum.split("-");

        if (dijelovi.length !== 3) {
            return datum;
        }

        const godina = dijelovi[0];
        const mjesec = dijelovi[1];
        const dan = dijelovi[2];

        return `${dan}.${mjesec}.${godina}.`;
    }


    function formatFirebaseDate(date) {

        const godina =
            date.getFullYear();

        const mjesec =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const dan =
            String(
                date.getDate()
            ).padStart(2, "0");

        return `${godina}-${mjesec}-${dan}`;
    }


    function danNedelje(date) {

        const dani = [
            "NED",
            "PON",
            "UTO",
            "SRI",
            "ČET",
            "PET",
            "SUB"
        ];

        return dani[date.getDay()];
    }


    function mjesecNaziv(date) {

        const mjeseci = [
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAJ",
            "JUN",
            "JUL",
            "AVG",
            "SEP",
            "OKT",
            "NOV",
            "DEC"
        ];

        return mjeseci[date.getMonth()];
    }


    /* =====================================================
       SMOOTH SCROLL
    ===================================================== */

    document.querySelectorAll('a[href="#termini"]').forEach(link => {

    link.addEventListener("click", function (event) {

        event.preventDefault();

        const target = document.getElementById("termini");

        if (!target) return;

        const startPosition = window.scrollY;
        const targetPosition =
            target.getBoundingClientRect().top +
            window.scrollY -
            80;

        const distance = targetPosition - startPosition;
        const duration = 900;

        let startTime = null;

        function animation(currentTime) {

            if (!startTime) {
                startTime = currentTime;
            }

            const progress = Math.min(
                (currentTime - startTime) / duration,
                1
            );

            // premium easing
            const eased =
                1 - Math.pow(1 - progress, 4);

            window.scrollTo(
                0,
                startPosition + distance * eased
            );

            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);

    });

});

    /* =====================================================
       ADMIN FORMA
    ===================================================== */

    const terminForm =
        document.getElementById("termin-form");

    const editIdInput =
        document.getElementById("edit-id");

    const submitButton =
        document.getElementById("submit-dugme");

    const cancelEdit =
        document.getElementById("otkazi-edit");


    if (terminForm) {

        terminForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const datumUnos =
                    document
                        .getElementById("datum")
                        .value
                        .trim();


                const vrijemeOd =
                    document
                        .getElementById("vrijeme-od")
                        .value
                        .trim();


                const vrijemeDo =
                    document
                        .getElementById("vrijeme-do")
                        .value
                        .trim();


                const editId =
                    editIdInput.value;


                /* =====================================
                   DATUM
                ===================================== */

                const datum =
                    datumZaFirebase(
                        datumUnos
                    );


                if (!datum) {

                    alert(
                        "Datum mora biti u formatu 01.10.2026."
                    );

                    return;
                }


                /* =====================================
                   VRIJEME
                ===================================== */

                if (
                    !vrijemeJeIspravno(
                        vrijemeOd
                    )
                ) {

                    alert(
                        "Vrijeme OD mora biti u formatu HH:MM, npr. 18:30."
                    );

                    return;
                }


                if (
                    !vrijemeJeIspravno(
                        vrijemeDo
                    )
                ) {

                    alert(
                        "Vrijeme DO mora biti u formatu HH:MM, npr. 19:45."
                    );

                    return;
                }


                /* =====================================
                   OD < DO
                ===================================== */

                if (
                    vrijemeUMinutama(vrijemeOd) >=
                    vrijemeUMinutama(vrijemeDo)
                ) {

                    alert(
                        "Vrijeme završetka mora biti nakon početka."
                    );

                    return;
                }


                /* =====================================
                   PROVJERA PREKLAPANJA
                ===================================== */

                const noviOd =
                    vrijemeUMinutama(
                        vrijemeOd
                    );

                const noviDo =
                    vrijemeUMinutama(
                        vrijemeDo
                    );


                const preklapanje =
                    Object.entries(sviTermini)
                        .some(
                            ([id, termin]) => {

                                /*
                                 * Kod uređivanja
                                 * ignorišemo trenutni termin.
                                 */

                                if (
                                    editId &&
                                    id === editId
                                ) {
                                    return false;
                                }


                                if (
                                    termin.datum !== datum
                                ) {
                                    return false;
                                }


                                const postojeciOd =
                                    vrijemeUMinutama(
                                        termin.vrijemeOd
                                    );


                                const postojeciDo =
                                    vrijemeUMinutama(
                                        termin.vrijemeDo
                                    );


                                return (
                                    noviOd <
                                    postojeciDo
                                    &&
                                    noviDo >
                                    postojeciOd
                                );

                            }
                        );


                if (preklapanje) {

                    alert(
                        "Ovaj termin se preklapa sa već postojećim terminom."
                    );

                    return;
                }


                /* =====================================
                   SPREMANJE
                ===================================== */

                try {

                    if (editId) {

                        await update(
                            ref(
                                db,
                                `termini/${editId}`
                            ),
                            {
                                datum,
                                vrijemeOd,
                                vrijemeDo
                            }
                        );


                        alert(
                            "Termin je uspješno izmijenjen."
                        );

                    } else {

                        await push(
                            terminiRef,
                            {
                                datum,
                                vrijemeOd,
                                vrijemeDo
                            }
                        );


                        alert(
                            "Termin je uspješno dodan."
                        );

                    }


                    /* =================================
                       RESET FORME
                    ================================= */

                    terminForm.reset();

                    editIdInput.value = "";

                    submitButton.innerHTML =
                        `DODAJ TERMIN <span>→</span>`;

                    cancelEdit.hidden = true;


                } catch (error) {

                    console.error(error);

                    alert(
                        "Greška prilikom spremanja termina."
                    );

                }

            }
        );


        /* =========================================
           ODUSTANI OD UREĐIVANJA
        ========================================= */

        if (cancelEdit) {

            cancelEdit.addEventListener(
                "click",
                () => {

                    terminForm.reset();

                    editIdInput.value = "";

                    submitButton.innerHTML =
                        `DODAJ TERMIN <span>→</span>`;

                    cancelEdit.hidden = true;

                }
            );

        }

    }


    /* =====================================================
       ADMIN - POSTOJEĆI TERMINI
    ===================================================== */

    const adminTermini =
        document.getElementById(
            "admin-termini"
        );


    if (adminTermini) {

        onValue(
            terminiRef,
            snapshot => {

                sviTermini =
                    snapshot.val() || {};


                adminTermini.innerHTML =
                    "";


                const termini =
                    Object.entries(
                        sviTermini
                    ).sort(
                        (a, b) => {

                            const A =
                                `${a[1].datum} ${a[1].vrijemeOd}`;

                            const B =
                                `${b[1].datum} ${b[1].vrijemeOd}`;

                            return A.localeCompare(B);

                        }
                    );


                /* =====================================
                   NEMA TERMINA
                ===================================== */

                if (
                    termini.length === 0
                ) {

                    adminTermini.innerHTML = `

                        <div class="empty-message">

                            <span>—</span>

                            <p>
                                Nema unesenih termina.
                            </p>

                        </div>

                    `;

                    return;
                }


                /* =====================================
                   PRIKAZ TERMINA
                ===================================== */

                termini.forEach(
                    ([id, termin]) => {

                        const div =
                            document.createElement(
                                "div"
                            );


                        div.className =
                            "admin-termin";


                        div.innerHTML = `

                            <div class="admin-termin-info">

                                <div class="admin-termin-date">

                                    ${formatDatumZaPrikaz(
                                        termin.datum
                                    )}

                                </div>


                                <div class="admin-termin-time">

                                    ${termin.vrijemeOd}

                                    —

                                    ${termin.vrijemeDo}

                                </div>

                            </div>


                            <div class="admin-termin-actions">

                                <button
                                    type="button"
                                    class="edit-button"
                                    data-id="${id}"
                                >
                                    UREDI
                                </button>


                                <button
                                    type="button"
                                    class="delete-button"
                                    data-id="${id}"
                                >
                                    OBRIŠI
                                </button>

                            </div>

                        `;


                        adminTermini.appendChild(
                            div
                        );

                    }
                );


                /* =====================================
                   UREDI
                ===================================== */

                document
                    .querySelectorAll(
                        ".edit-button"
                    )
                    .forEach(button => {

                        button.addEventListener(
                            "click",
                            () => {

                                const id =
                                    button.dataset.id;


                                const termin =
                                    sviTermini[id];


                                if (!termin) {
                                    return;
                                }


                                document
                                    .getElementById(
                                        "datum"
                                    )
                                    .value =
                                    formatDatumZaPrikaz(
                                        termin.datum
                                    );


                                document
                                    .getElementById(
                                        "vrijeme-od"
                                    )
                                    .value =
                                    termin.vrijemeOd;


                                document
                                    .getElementById(
                                        "vrijeme-do"
                                    )
                                    .value =
                                    termin.vrijemeDo;


                                editIdInput.value =
                                    id;


                                submitButton.innerHTML =
                                    `SAČUVAJ IZMJENE <span>→</span>`;


                                cancelEdit.hidden =
                                    false;


                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth"
                                });

                            }
                        );

                    });


                /* =====================================
                   OBRIŠI
                ===================================== */

                document
                    .querySelectorAll(
                        ".delete-button"
                    )
                    .forEach(button => {

                        button.addEventListener(
                            "click",
                            async () => {

                                const id =
                                    button.dataset.id;


                                const potvrda =
                                    confirm(
                                        "Da li sigurno želiš obrisati ovaj termin?"
                                    );


                                if (!potvrda) {
                                    return;
                                }


                                try {

                                    await remove(
                                        ref(
                                            db,
                                            `termini/${id}`
                                        )
                                    );

                                } catch (error) {

                                    console.error(
                                        error
                                    );


                                    alert(
                                        "Greška prilikom brisanja termina."
                                    );

                                }

                            }
                        );

                    });

            }
        );

    }


    /* =====================================================
       JAVNA STRANICA
    ===================================================== */

    const schedule =
        document.querySelector(
            ".schedule"
        );


    if (schedule) {

        const daysContainer =
            document.querySelector(
                ".days"
            );


        /* =========================================
           KREIRAJ 7 DANA
        ========================================= */

        function napraviDane() {
    if (!daysContainer) {
        return;
    }

    daysContainer.innerHTML = "";

    const danas = new Date();

    // Početni datum = uvijek danas
    danas.setHours(0, 0, 0, 0);

    // Prikazujemo narednih 31 dan
    for (let i = 0; i < 31; i++) {

        const date = new Date(danas);

        date.setDate(danas.getDate() + i);

        const button = document.createElement("button");

        button.type = "button";
        button.className = "day";

        button.dataset.date =
            formatFirebaseDate(date);

        // Danas je automatski aktivan
        if (i === 0) {

            button.classList.add("active");

            odabraniDatum =
                button.dataset.date;
        }

        button.innerHTML = `
            <span>
                ${danNedelje(date)}
            </span>

            <strong>
                ${String(
                    date.getDate()
                ).padStart(2, "0")}
            </strong>

            <small>
                ${mjesecNaziv(date)}
            </small>
        `;

        button.addEventListener("click", () => {

            document
                .querySelectorAll(".day")
                .forEach(day => {
                    day.classList.remove("active");
                });

            button.classList.add("active");

            odabraniDatum =
                button.dataset.date;

            prikaziRaspored();

            // Kliknuti datum lagano dovodi u centar
            button.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center"
            });
        });

        daysContainer.appendChild(button);
    }

    // Automatski pozicioniraj kalendar na danas
    const danasnjiDan =
        daysContainer.querySelector(".day.active");

    if (danasnjiDan) {
        danasnjiDan.scrollIntoView({
            behavior: "auto",
            block: "nearest",
            inline: "center"
        });
    }
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");

        if (!targetId || targetId === "#") {
            return;
        }

        const target = document.querySelector(targetId);

        if (!target) {
            return;
        }

        event.preventDefault();

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        // zatvori mobilni meni ako je otvoren
        document.body.classList.remove("menu-open");
    });
});

        /* =========================================
           DA LI JE INTERVAL ZAUZET
        ========================================= */

        function intervalJeZauzet(
            pocetak,
            kraj
        ) {

            const pocetakMin =
                vrijemeUMinutama(
                    pocetak
                );


            const krajMin =
                vrijemeUMinutama(
                    kraj
                );


            return Object.values(
                sviTermini
            ).some(
                termin => {

                    if (
                        termin.datum !==
                        odabraniDatum
                    ) {

                        return false;
                    }


                    const terminOd =
                        vrijemeUMinutama(
                            termin.vrijemeOd
                        );


                    const terminDo =
                        vrijemeUMinutama(
                            termin.vrijemeDo
                        );


                    return (
                        pocetakMin <
                        terminDo
                        &&
                        krajMin >
                        terminOd
                    );

                }
            );

        }


        /* =========================================
           JAVNI RASPORED
        ========================================= */

        function prikaziRaspored() {

            schedule.innerHTML =
                "";


            /*
             * RADNO VRIJEME
             *
             * 07:00 - 23:00
             */

            const pocetakDana =
                7 * 60;


            const krajDana =
                23 * 60;


            /*
             * Svakih 30 minuta.
             */

            for (
                let minuta = pocetakDana;
                minuta < krajDana;
                minuta += 30
            ) {

                const sat =
                    Math.floor(
                        minuta / 60
                    );


                const min =
                    minuta % 60;


                const sljedecih30 =
                    minuta + 30;


                const sljedeciSat =
                    Math.floor(
                        sljedecih30 / 60
                    );


                const sljedeciMin =
                    sljedecih30 % 60;


                const od =
                    `${String(sat).padStart(
                        2,
                        "0"
                    )}:${String(min).padStart(
                        2,
                        "0"
                    )}`;


                const doVrijeme =
                    `${String(sljedeciSat).padStart(
                        2,
                        "0"
                    )}:${String(sljedeciMin).padStart(
                        2,
                        "0"
                    )}`;


                const zauzeto =
                    intervalJeZauzet(
                        od,
                        doVrijeme
                    );


                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    `schedule-row ${
                        zauzeto
                            ? "occupied"
                            : "available"
                    }`;


                row.innerHTML = `

                    <div class="schedule-time">

                        <strong>
                            ${od}
                        </strong>

                        <span>
                            — ${doVrijeme}
                        </span>

                    </div>


                    <div class="schedule-status">
    <div class="${zauzeto ? "status-text status-busy" : "status-text status-free"}">
        ${zauzeto ? "ZAUZETO" : "SLOBODNO"}
    </div>

    ${
        zauzeto
            ? ""
            : `
                <a
                    href="tel:+387XXXXXXXXX"
                    class="booking-phone"
                >
                    REZERVACIJE
                    <span>061 123 456</span>
                </a>
            `
    }
</div>

                `;


                schedule.appendChild(
                    row
                );

            }

        }


        /* =========================================
           FIREBASE
        ========================================= */

        onValue(
            terminiRef,
            snapshot => {

                sviTermini =
                    snapshot.val() || {};


                if (!odabraniDatum) {

                    napraviDane();

                }


                prikaziRaspored();

            }
        );

    }

});
