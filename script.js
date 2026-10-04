import { db } from "./firebase.js";

import {
    ref,
    push,
    onValue,
    remove,
    update
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";


document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       FIREBASE
    ========================================================= */

    const terminiRef = ref(db, "termini");

    let sviTermini = {};
    let odabraniDatum = null;


    /* =========================================================
       NAVBAR — DINAMIČKO SMANJIVANJE PRI SCROLLU
    ========================================================= */

    const navbar = document.querySelector(".navbar");

    let posljednjiScroll = window.scrollY;
    let scrollTick = false;

    function azurirajNavbar() {

        if (!navbar) {
            return;
        }

        const trenutno = window.scrollY;

        /*
            Na samom vrhu uvijek vraćamo originalnu veličinu.
        */

        if (trenutno <= 20) {
            navbar.classList.remove("navbar-compact");
            navbar.classList.remove("navbar-scrolled");

            posljednjiScroll = trenutno;
            scrollTick = false;

            return;
        }

        /*
            Dodajemo klasu kada korisnik nije više na vrhu.
        */

        navbar.classList.add("navbar-scrolled");

        /*
            Scroll prema dole:
            navbar se smanjuje.
        */

        if (trenutno > posljednjiScroll + 3) {
            navbar.classList.add("navbar-compact");
        }

        /*
            Scroll prema gore:
            navbar se vraća u originalnu veličinu.
        */

        else if (trenutno < posljednjiScroll - 3) {
            navbar.classList.remove("navbar-compact");
        }

        posljednjiScroll = trenutno;
        scrollTick = false;
    }


    window.addEventListener(
        "scroll",
        () => {

            if (!scrollTick) {

                window.requestAnimationFrame(
                    azurirajNavbar
                );

                scrollTick = true;
            }

        },
        {
            passive: true
        }
    );


    /* =========================================================
       POMOĆNE FUNKCIJE
    ========================================================= */

    function vrijemeUMinutama(vrijeme) {

        if (
            !vrijeme ||
            !vrijeme.includes(":")
        ) {
            return NaN;
        }

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
        01.10.2026.
        ↓
        2026-10-01
    */

    function datumZaFirebase(datum) {

        if (!datum) {
            return null;
        }

        const cisto = datum
            .trim()
            .replace(/\.$/, "");

        const dijelovi = cisto.split(".");

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
        2026-10-01
        ↓
        01.10.2026.
    */

    function formatDatumZaPrikaz(datum) {

        if (!datum) {
            return "";
        }

        const dijelovi = datum.split("-");

        if (dijelovi.length !== 3) {
            return datum;
        }

        const godina = dijelovi[0];
        const mjesec = dijelovi[1];
        const dan = dijelovi[2];

        return `${dan}.${mjesec}.${godina}.`;
    }


    function formatFirebaseDate(date) {

        const godina = date.getFullYear();

        const mjesec = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const dan = String(
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


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =========================================================
       MOBILNI MENI
    ========================================================= */

    const menuToggle =
        document.getElementById("menuToggle");

    const mobileMenu =
        document.querySelector(".mobile-menu");

    const mobileClose =
        document.querySelector(".mobile-close");


    function zatvoriMobilniMeni() {

        if (menuToggle) {
            menuToggle.checked = false;
        }

        document.body.classList.remove(
            "menu-open"
        );
    }


    function otvoriMobilniMeni() {

        document.body.classList.add(
            "menu-open"
        );
    }


    if (menuToggle) {

        menuToggle.addEventListener(
            "change",
            () => {

                if (menuToggle.checked) {
                    otvoriMobilniMeni();
                } else {
                    zatvoriMobilniMeni();
                }

            }
        );
    }


    if (mobileClose) {

        mobileClose.addEventListener(
            "click",
            zatvoriMobilniMeni
        );
    }


    if (mobileMenu) {

        mobileMenu
            .querySelectorAll("a")
            .forEach(link => {

                link.addEventListener(
                    "click",
                    () => {
                        zatvoriMobilniMeni();
                    }
                );

            });
    }


    /*
        Ako korisnik klikne ESC,
        zatvaramo mobilni meni.
    */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                menuToggle &&
                menuToggle.checked
            ) {
                zatvoriMobilniMeni();
            }

        }
    );


    /* =========================================================
       SMOOTH SCROLL
    ========================================================= */

    document
        .querySelectorAll('a[href^="#"]')
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

                    const targetId =
                        link.getAttribute("href");

                    if (
                        !targetId ||
                        targetId === "#"
                    ) {
                        return;
                    }

                    const target =
                        document.querySelector(
                            targetId
                        );

                    if (!target) {
                        return;
                    }

                    event.preventDefault();

                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                    zatvoriMobilniMeni();
                }
            );

        });


    /* =========================================================
       ADMIN FORMA
    ========================================================= */

    const terminForm =
        document.getElementById("termin-form");

    const editIdInput =
        document.getElementById("edit-id");

    const submitButton =
        document.getElementById("submit-dugme");

    const cancelEdit =
        document.getElementById("otkazi-edit");


    function resetAdminForm() {

        if (!terminForm) {
            return;
        }

        terminForm.reset();

        if (editIdInput) {
            editIdInput.value = "";
        }

        if (submitButton) {

            submitButton.innerHTML =
                `DODAJ TERMIN <span>→</span>`;
        }

        if (cancelEdit) {
            cancelEdit.hidden = true;
        }
    }


    if (terminForm) {

        terminForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const datumInput =
                    document.getElementById(
                        "datum"
                    );

                const vrijemeOdInput =
                    document.getElementById(
                        "vrijeme-od"
                    );

                const vrijemeDoInput =
                    document.getElementById(
                        "vrijeme-do"
                    );


                if (
                    !datumInput ||
                    !vrijemeOdInput ||
                    !vrijemeDoInput
                ) {
                    return;
                }


                const datumUnos =
                    datumInput.value.trim();

                const vrijemeOd =
                    vrijemeOdInput.value.trim();

                const vrijemeDo =
                    vrijemeDoInput.value.trim();

                const editId =
                    editIdInput
                        ? editIdInput.value
                        : "";


                /* DATUM */

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


                /* VRIJEME OD */

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


                /* VRIJEME DO */

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


                /* OD < DO */

                const noviOd =
                    vrijemeUMinutama(
                        vrijemeOd
                    );

                const noviDo =
                    vrijemeUMinutama(
                        vrijemeDo
                    );


                if (noviOd >= noviDo) {

                    alert(
                        "Vrijeme završetka mora biti nakon početka."
                    );

                    return;
                }


                /* PREKLAPANJE */

                const preklapanje =
                    Object.entries(
                        sviTermini
                    ).some(
                        ([id, termin]) => {

                            /*
                                Ako uređujemo isti termin,
                                njega preskačemo.
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
                                    postojeciDo &&
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


                /* SPREMANJE */

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


                    resetAdminForm();

                } catch (error) {

                    console.error(
                        "Greška prilikom spremanja:",
                        error
                    );

                    alert(
                        "Greška prilikom spremanja termina."
                    );
                }

            }
        );


        /* ODUSTANI */

        if (cancelEdit) {

            cancelEdit.addEventListener(
                "click",
                resetAdminForm
            );
        }
    }


    /* =========================================================
       ADMIN — POSTOJEĆI TERMINI
    ========================================================= */

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

                adminTermini.innerHTML = "";


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


                /* NEMA TERMINA */

                if (termini.length === 0) {

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


                /* PRIKAZ */

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
                                    ${escapeHtml(
                                        formatDatumZaPrikaz(
                                            termin.datum
                                        )
                                    )}
                                </div>

                                <div class="admin-termin-time">
                                    ${escapeHtml(
                                        termin.vrijemeOd
                                    )}
                                    —
                                    ${escapeHtml(
                                        termin.vrijemeDo
                                    )}
                                </div>

                            </div>

                            <div class="admin-termin-actions">

                                <button
                                    type="button"
                                    class="edit-button"
                                    data-id="${escapeHtml(id)}"
                                >
                                    UREDI
                                </button>

                                <button
                                    type="button"
                                    class="delete-button"
                                    data-id="${escapeHtml(id)}"
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


                /* UREDI */

                adminTermini
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


                                const datumInput =
                                    document.getElementById(
                                        "datum"
                                    );

                                const vrijemeOdInput =
                                    document.getElementById(
                                        "vrijeme-od"
                                    );

                                const vrijemeDoInput =
                                    document.getElementById(
                                        "vrijeme-do"
                                    );


                                if (
                                    !datumInput ||
                                    !vrijemeOdInput ||
                                    !vrijemeDoInput
                                ) {
                                    return;
                                }


                                datumInput.value =
                                    formatDatumZaPrikaz(
                                        termin.datum
                                    );

                                vrijemeOdInput.value =
                                    termin.vrijemeOd;

                                vrijemeDoInput.value =
                                    termin.vrijemeDo;


                                if (editIdInput) {
                                    editIdInput.value =
                                        id;
                                }


                                if (submitButton) {

                                    submitButton.innerHTML =
                                        `SAČUVAJ IZMJENE <span>→</span>`;
                                }


                                if (cancelEdit) {
                                    cancelEdit.hidden =
                                        false;
                                }


                                window.scrollTo({
                                    top: 0,
                                    behavior: "smooth"
                                });

                            }
                        );

                    });


                /* OBRIŠI */

                adminTermini
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
                                        "Greška prilikom brisanja:",
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


    /* =========================================================
       JAVNA STRANICA
    ========================================================= */

    const schedule =
        document.querySelector(
            ".schedule"
        );


    /*
        Ako nismo na javnoj stranici,
        završavamo ovdje.
    */

    if (!schedule) {
        return;
    }


    const daysContainer =
        document.querySelector(
            ".days"
        );

    const prevDay =
        document.querySelector(
            ".prev-day"
        );

    const nextDay =
        document.querySelector(
            ".next-day"
        );

    const selectedDateElement =
        document.querySelector(
            ".selected-date"
        );


    /* =========================================================
       STRELICA LIJEVO
    ========================================================= */

    if (
        prevDay &&
        daysContainer
    ) {

        prevDay.addEventListener(
            "click",
            () => {

                daysContainer.scrollBy({
                    left: -300,
                    behavior: "smooth"
                });

            }
        );
    }


    /* =========================================================
       STRELICA DESNO
    ========================================================= */

    if (
        nextDay &&
        daysContainer
    ) {

        nextDay.addEventListener(
            "click",
            () => {

                daysContainer.scrollBy({
                    left: 300,
                    behavior: "smooth"
                });

            }
        );
    }


    /* =========================================================
       AŽURIRAJ DATUM
    ========================================================= */

    function azurirajOdabraniDatum() {

        if (
            !selectedDateElement ||
            !odabraniDatum
        ) {
            return;
        }


        /*
            Podržavamo i:
            .selected-date
            i ako postoji #selectedDateLabel
        */

        const label =
            document.getElementById(
                "selectedDateLabel"
            );


        if (label) {

            label.textContent =
                formatDatumZaPrikaz(
                    odabraniDatum
                );

        } else {

            selectedDateElement.textContent =
                formatDatumZaPrikaz(
                    odabraniDatum
                );
        }
    }


    /* =========================================================
       KREIRAJ 31 DAN
    ========================================================= */

    function napraviDane() {

        if (!daysContainer) {
            return;
        }


        daysContainer.innerHTML = "";


        const danas =
            new Date();

        danas.setHours(
            0,
            0,
            0,
            0
        );


        for (
            let i = 0;
            i < 31;
            i++
        ) {

            const date =
                new Date(danas);


            date.setDate(
                danas.getDate() + i
            );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";

            button.className =
                "day";


            button.dataset.date =
                formatFirebaseDate(
                    date
                );


            /*
                Prvi dan = danas.
            */

            if (i === 0) {

                button.classList.add(
                    "active"
                );

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


            button.addEventListener(
                "click",
                () => {

                    daysContainer
                        .querySelectorAll(
                            ".day"
                        )
                        .forEach(day => {

                            day.classList.remove(
                                "active"
                            );

                        });


                    button.classList.add(
                        "active"
                    );


                    odabraniDatum =
                        button.dataset.date;


                    azurirajOdabraniDatum();

                    prikaziRaspored();


                    /*
                        Automatski centriramo
                        odabrani dan.
                    */

                    button.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                        inline: "center"
                    });

                }
            );


            daysContainer.appendChild(
                button
            );
        }


        /*
            Centriraj danas.
        */

        const danasnjiDan =
            daysContainer.querySelector(
                ".day.active"
            );


        if (danasnjiDan) {

            danasnjiDan.scrollIntoView({
                behavior: "auto",
                block: "nearest",
                inline: "center"
            });
        }


        azurirajOdabraniDatum();
    }


    /* =========================================================
       DA LI JE INTERVAL ZAUZET
    ========================================================= */

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
                        terminDo &&
                    krajMin >
                        terminOd
                );
            }
        );
    }


    /* =========================================================
       JAVNI RASPORED
    ========================================================= */

    function prikaziRaspored() {

        if (!schedule) {
            return;
        }


        schedule.innerHTML = "";


        /*
            RADNO VRIJEME

            07:00 - 23:00
        */

        const pocetakDana =
            7 * 60;

        const krajDana =
            23 * 60;


        /*
            Svakih 30 minuta.
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
                `${String(
                    sat
                ).padStart(
                    2,
                    "0"
                )}:${String(
                    min
                ).padStart(
                    2,
                    "0"
                )}`;


            const doVrijeme =
                `${String(
                    sljedeciSat
                ).padStart(
                    2,
                    "0"
                )}:${String(
                    sljedeciMin
                ).padStart(
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


            /*
                Klase:

                schedule-row
                available
                occupied
            */

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

                    <div class="status-text ${
                        zauzeto
                            ? "status-busy"
                            : "status-free"
                    }">

                        ${
                            zauzeto
                                ? "ZAUZETO"
                                : "SLOBODNO"
                        }

                    </div>


                    ${
                        zauzeto
                            ? ""
                            : `
                                <a
                                    href="tel:+38761745046"
                                    class="booking-phone"
                                >
                                    REZERVIŠI
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


    /* =========================================================
       FIREBASE — JAVNI RASPORED
    ========================================================= */

    onValue(
        terminiRef,
        snapshot => {

            sviTermini =
                snapshot.val() || {};


            /*
                Dane pravimo samo prvi put.
            */

            if (!odabraniDatum) {

                napraviDane();
            }


            /*
                Nakon svake Firebase promjene
                osvježavamo raspored.
            */

            prikaziRaspored();

        },

        error => {

            console.error(
                "Firebase greška:",
                error
            );


            schedule.innerHTML = `
                <div class="empty-message">

                    <span>!</span>

                    <p>
                        Raspored trenutno nije moguće učitati.
                    </p>

                </div>
            `;
        }
    );

});