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
       NAVBAR
    ========================================================= */

    const navbar = document.querySelector(".navbar");

    let posljednjiScroll = window.scrollY;
    let scrollTick = false;


    function azurirajNavbar() {

        if (!navbar) {
            return;
        }

        const trenutno = window.scrollY;


        if (trenutno <= 20) {

            navbar.classList.remove("navbar-compact");
            navbar.classList.remove("navbar-scrolled");

            posljednjiScroll = trenutno;
            scrollTick = false;

            return;
        }


        navbar.classList.add("navbar-scrolled");


        if (trenutno > posljednjiScroll + 3) {

            navbar.classList.add("navbar-compact");

        } else if (trenutno < posljednjiScroll - 3) {

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
                    zatvoriMobilniMeni
                );

            });
    }


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
       =========================================================
       CUSTOM ADMIN DATE PICKER
       =========================================================
       ========================================================= */

    const terminForm =
        document.getElementById("termin-form");


    /*
     * Ovo se izvršava samo na admin stranici.
     */

    if (terminForm) {

        const datumInput =
            document.getElementById("datum");

        const vrijemeOdInput =
            document.getElementById("vrijeme-od");

        const vrijemeDoInput =
            document.getElementById("vrijeme-do");


        /*
         * Ako su inputi još uvijek type="date/time",
         * pretvaramo ih u obične text inpute.
         */

        if (datumInput) {

            datumInput.type = "text";
            datumInput.readOnly = true;
            datumInput.removeAttribute("min");
            datumInput.removeAttribute("max");
            datumInput.removeAttribute("step");
        }


        if (vrijemeOdInput) {

            vrijemeOdInput.type = "text";
            vrijemeOdInput.readOnly = true;
            vrijemeOdInput.removeAttribute("min");
            vrijemeOdInput.removeAttribute("max");
            vrijemeOdInput.removeAttribute("step");
        }


        if (vrijemeDoInput) {

            vrijemeDoInput.type = "text";
            vrijemeDoInput.readOnly = true;
            vrijemeDoInput.removeAttribute("min");
            vrijemeDoInput.removeAttribute("max");
            vrijemeDoInput.removeAttribute("step");
        }


        /* =====================================================
           CUSTOM PICKER CSS
        ===================================================== */

        const pickerStyle =
            document.createElement("style");


        pickerStyle.textContent = `

            .kockica-picker {

                position: fixed;

                z-index: 999999;

                width: min(
                    360px,
                    calc(100vw - 24px)
                );

                background: #0d0d0d;

                border: 1px solid
                    rgba(245, 196, 0, .28);

                border-radius: 20px;

                box-shadow:
                    0 24px 80px
                    rgba(0,0,0,.55);

                padding: 18px;

                color: #fff;

                font-family:
                    "DM Sans",
                    sans-serif;

                animation:
                    kockicaPickerIn
                    .18s ease-out;

            }


            @keyframes kockicaPickerIn {

                from {
                    opacity: 0;
                    transform:
                        translateY(-8px)
                        scale(.98);
                }

                to {
                    opacity: 1;
                    transform:
                        translateY(0)
                        scale(1);
                }

            }


            .kockica-picker-header {

                display: flex;

                align-items: center;

                justify-content:
                    space-between;

                margin-bottom: 18px;

            }


            .kockica-picker-title {

                font-family:
                    "Manrope",
                    sans-serif;

                font-size: 17px;

                font-weight: 800;

                letter-spacing: .04em;

                color: #fff;

            }


            .kockica-picker-subtitle {

                display: block;

                margin-top: 4px;

                color: #999;

                font-size: 10px;

                font-weight: 700;

                letter-spacing: .14em;

            }


            .kockica-picker-arrow {

                width: 40px;

                height: 40px;

                border: 1px solid
                    rgba(255,255,255,.12);

                border-radius: 11px;

                background: #151515;

                color: #fff;

                cursor: pointer;

                font-size: 18px;

                transition:
                    .18s ease;

            }


            .kockica-picker-arrow:hover {

                background: #f5c400;

                color: #080808;

                border-color:
                    #f5c400;

            }


            .kockica-weekdays {

                display: grid;

                grid-template-columns:
                    repeat(7, 1fr);

                gap: 4px;

                margin-bottom: 6px;

            }


            .kockica-weekdays span {

                text-align: center;

                color: #666;

                font-size: 9px;

                font-weight: 800;

                letter-spacing: .08em;

                padding: 5px 0;

            }


            .kockica-calendar-grid {

                display: grid;

                grid-template-columns:
                    repeat(7, 1fr);

                gap: 5px;

            }


            .kockica-calendar-day {

                aspect-ratio: 1;

                border: 0;

                border-radius: 10px;

                background: transparent;

                color: #ddd;

                font-size: 13px;

                font-weight: 700;

                cursor: pointer;

                transition:
                    background .15s ease,
                    color .15s ease,
                    transform .15s ease;

            }


            .kockica-calendar-day:hover {

                background: #1c1c1c;

                color: #f5c400;

            }


            .kockica-calendar-day.other-month {

                color: #3f3f3f;

            }


            .kockica-calendar-day.today {

                border:
                    1px solid
                    rgba(245,196,0,.5);

            }


            .kockica-calendar-day.selected {

                background: #f5c400;

                color: #080808;

            }


            .kockica-calendar-day.selected:hover {

                background: #ffd52a;

                color: #080808;

            }


            .kockica-picker-footer {

                display: flex;

                justify-content:
                    space-between;

                align-items: center;

                gap: 10px;

                margin-top: 16px;

                padding-top: 14px;

                border-top:
                    1px solid
                    rgba(255,255,255,.08);

            }


            .kockica-current-date {

                color: #999;

                font-size: 11px;

                font-weight: 600;

            }


            .kockica-today-button {

                border: 0;

                background: transparent;

                color: #f5c400;

                font-size: 10px;

                font-weight: 800;

                letter-spacing: .12em;

                cursor: pointer;

            }


            /* TIME PICKER */

            .kockica-time-picker {

                width: min(
                    300px,
                    calc(100vw - 24px)
                );

            }


            .kockica-time-grid {

                display: grid;

                grid-template-columns:
                    repeat(3, 1fr);

                gap: 7px;

                max-height: 310px;

                overflow-y: auto;

                padding-right: 3px;

            }


            .kockica-time-button {

                min-height: 44px;

                border:
                    1px solid
                    rgba(255,255,255,.08);

                border-radius: 10px;

                background: #151515;

                color: #ddd;

                font-size: 13px;

                font-weight: 700;

                cursor: pointer;

                transition:
                    .15s ease;

            }


            .kockica-time-button:hover {

                border-color:
                    rgba(245,196,0,.45);

                color: #f5c400;

                background: #1b1b1b;

            }


            .kockica-time-button.selected {

                background: #f5c400;

                border-color: #f5c400;

                color: #080808;

            }


            @media (max-width: 520px) {

                .kockica-picker {

                    border-radius: 18px;

                    padding: 15px;

                }


                .kockica-calendar-grid {

                    gap: 3px;

                }


                .kockica-calendar-day {

                    border-radius: 8px;

                }


                .kockica-time-grid {

                    grid-template-columns:
                        repeat(3, 1fr);

                }

            }

        `;


        document.head.appendChild(
            pickerStyle
        );


        let aktivniPicker = null;

        let trenutniMjesec =
            new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
            );


        function zatvoriPicker() {

            if (aktivniPicker) {

                aktivniPicker.remove();

                aktivniPicker = null;
            }
        }


        function pozicionirajPicker(
            picker,
            input
        ) {

            const rect =
                input.getBoundingClientRect();


            let left = rect.left;

            let top =
                rect.bottom + 8;


            const pickerWidth =
                picker.offsetWidth;


            const pickerHeight =
                picker.offsetHeight;


            if (
                left + pickerWidth >
                window.innerWidth - 12
            ) {

                left =
                    window.innerWidth -
                    pickerWidth -
                    12;
            }


            if (left < 12) {
                left = 12;
            }


            if (
                top + pickerHeight >
                window.innerHeight - 12
            ) {

                top =
                    rect.top -
                    pickerHeight -
                    8;
            }


            if (top < 12) {
                top = 12;
            }


            picker.style.left =
                `${left}px`;

            picker.style.top =
                `${top}px`;
        }


        function datumIzInputa() {

            if (!datumInput?.value) {
                return null;
            }


            const firebaseDatum =
                datumZaFirebase(
                    datumInput.value
                );


            if (!firebaseDatum) {
                return null;
            }


            const [godina, mjesec, dan] =
                firebaseDatum
                    .split("-")
                    .map(Number);


            return new Date(
                godina,
                mjesec - 1,
                dan
            );
        }


        function otvoriDatePicker() {

            zatvoriPicker();


            const picker =
                document.createElement(
                    "div"
                );


            picker.className =
                "kockica-picker";


            const izabraniDatum =
                datumIzInputa();


            if (izabraniDatum) {

                trenutniMjesec =
                    new Date(
                        izabraniDatum.getFullYear(),
                        izabraniDatum.getMonth(),
                        1
                    );

            }


            picker.innerHTML = `

                <div class="kockica-picker-header">

                    <div>

                        <div
                            class="kockica-picker-title"
                            data-picker-title
                        ></div>

                        <span
                            class="kockica-picker-subtitle"
                        >
                            ODABERI DATUM
                        </span>

                    </div>


                    <div
                        style="
                            display:flex;
                            gap:6px;
                        "
                    >

                        <button
                            type="button"
                            class="kockica-picker-arrow"
                            data-prev-month
                            aria-label="Prethodni mjesec"
                        >
                            ←
                        </button>

                        <button
                            type="button"
                            class="kockica-picker-arrow"
                            data-next-month
                            aria-label="Sljedeći mjesec"
                        >
                            →
                        </button>

                    </div>

                </div>


                <div class="kockica-weekdays">

                    <span>PON</span>
                    <span>UTO</span>
                    <span>SRI</span>
                    <span>ČET</span>
                    <span>PET</span>
                    <span>SUB</span>
                    <span>NED</span>

                </div>


                <div
                    class="kockica-calendar-grid"
                    data-calendar-grid
                ></div>


                <div
                    class="kockica-picker-footer"
                >

                    <span
                        class="kockica-current-date"
                        data-current-date
                    >
                        Odaberi datum
                    </span>

                    <button
                        type="button"
                        class="kockica-today-button"
                        data-today
                    >
                        DANAS
                    </button>

                </div>

            `;


            document.body.appendChild(
                picker
            );


            aktivniPicker = picker;


            const title =
                picker.querySelector(
                    "[data-picker-title]"
                );


            const grid =
                picker.querySelector(
                    "[data-calendar-grid]"
                );


            const currentDate =
                picker.querySelector(
                    "[data-current-date]"
                );


            function iscrtajKalendar() {

                const godina =
                    trenutniMjesec.getFullYear();

                const mjesec =
                    trenutniMjesec.getMonth();


                title.textContent =
                    `${[
                        "JANUAR",
                        "FEBRUAR",
                        "MART",
                        "APRIL",
                        "MAJ",
                        "JUNI",
                        "JULI",
                        "AVGUST",
                        "SEPTEMBAR",
                        "OKTOBAR",
                        "NOVEMBAR",
                        "DECEMBAR"
                    ][mjesec]} ${godina}`;


                grid.innerHTML = "";


                /*
                 * Ponedjeljak = 0
                 */

                const prviDan =
                    new Date(
                        godina,
                        mjesec,
                        1
                    );


                let offset =
                    prviDan.getDay() - 1;


                if (offset < 0) {
                    offset = 6;
                }


                const brojDana =
                    new Date(
                        godina,
                        mjesec + 1,
                        0
                    ).getDate();


                const brojDanaPrethodnog =
                    new Date(
                        godina,
                        mjesec,
                        0
                    ).getDate();


                const danas =
                    new Date();


                danas.setHours(
                    0,
                    0,
                    0,
                    0
                );


                for (
                    let i = offset - 1;
                    i >= 0;
                    i--
                ) {

                    const dan =
                        brojDanaPrethodnog - i;


                    const dugme =
                        document.createElement(
                            "button"
                        );


                    dugme.type = "button";

                    dugme.className =
                        "kockica-calendar-day other-month";

                    dugme.textContent =
                        dan;

                    dugme.disabled = true;

                    grid.appendChild(
                        dugme
                    );
                }


                for (
                    let dan = 1;
                    dan <= brojDana;
                    dan++
                ) {

                    const dugme =
                        document.createElement(
                            "button"
                        );


                    dugme.type = "button";

                    dugme.className =
                        "kockica-calendar-day";


                    const datum =
                        new Date(
                            godina,
                            mjesec,
                            dan
                        );


                    datum.setHours(
                        0,
                        0,
                        0,
                        0
                    );


                    if (
                        datum.getTime() ===
                        danas.getTime()
                    ) {

                        dugme.classList.add(
                            "today"
                        );
                    }


                    const firebaseDatum =
                        formatFirebaseDate(
                            datum
                        );


                    if (
                        datumInput.value &&
                        datumInput.value
                            .startsWith(
                                String(dan)
                                    .padStart(2, "0") +
                                "." +
                                String(mjesec + 1)
                                    .padStart(2, "0") +
                                "." +
                                godina
                            )
                    ) {

                        dugme.classList.add(
                            "selected"
                        );
                    }


                    dugme.textContent =
                        String(dan);


                    dugme.addEventListener(
                        "click",
                        () => {

                            datumInput.value =
                                formatDatumZaPrikaz(
                                    firebaseDatum
                                );


                            zatvoriPicker();

                            datumInput.focus();
                        }
                    );


                    grid.appendChild(
                        dugme
                    );
                }


                while (
                    grid.children.length < 42
                ) {

                    const dugme =
                        document.createElement(
                            "button"
                        );

                    dugme.type = "button";

                    dugme.className =
                        "kockica-calendar-day other-month";

                    dugme.disabled = true;

                    dugme.textContent =
                        String(
                            grid.children.length -
                            brojDana -
                            offset +
                            1
                        );

                    grid.appendChild(
                        dugme
                    );
                }


                const odabrani =
                    datumIzInputa();


                currentDate.textContent =
                    odabrani
                        ? formatDatumZaPrikaz(
                            formatFirebaseDate(
                                odabrani
                            )
                        )
                        : "Odaberi datum";
            }


            picker
                .querySelector(
                    "[data-prev-month]"
                )
                .addEventListener(
                    "click",
                    () => {

                        trenutniMjesec =
                            new Date(
                                trenutniMjesec
                                    .getFullYear(),
                                trenutniMjesec
                                    .getMonth() - 1,
                                1
                            );

                        iscrtajKalendar();
                    }
                );


            picker
                .querySelector(
                    "[data-next-month]"
                )
                .addEventListener(
                    "click",
                    () => {

                        trenutniMjesec =
                            new Date(
                                trenutniMjesec
                                    .getFullYear(),
                                trenutniMjesec
                                    .getMonth() + 1,
                                1
                            );

                        iscrtajKalendar();
                    }
                );


            picker
                .querySelector(
                    "[data-today]"
                )
                .addEventListener(
                    "click",
                    () => {

                        const danas =
                            new Date();


                        datumInput.value =
                            formatDatumZaPrikaz(
                                formatFirebaseDate(
                                    danas
                                )
                            );


                        trenutniMjesec =
                            new Date(
                                danas.getFullYear(),
                                danas.getMonth(),
                                1
                            );


                        iscrtajKalendar();
                    }
                );


            iscrtajKalendar();


            pozicionirajPicker(
                picker,
                datumInput
            );
        }


        /* =====================================================
           CUSTOM TIME PICKER
        ===================================================== */

        function otvoriTimePicker(
            input
        ) {

            zatvoriPicker();


            const picker =
                document.createElement(
                    "div"
                );


            picker.className =
                "kockica-picker kockica-time-picker";


            const trenutnaVrijednost =
                input.value;


            picker.innerHTML = `

                <div
                    class="kockica-picker-header"
                >

                    <div>

                        <div
                            class="kockica-picker-title"
                        >
                            ODABERI VRIJEME
                        </div>

                        <span
                            class="kockica-picker-subtitle"
                        >
                            24-SATNI FORMAT
                        </span>

                    </div>

                </div>


                <div
                    class="kockica-time-grid"
                    data-time-grid
                ></div>

            `;


            document.body.appendChild(
                picker
            );


            aktivniPicker = picker;


            const grid =
                picker.querySelector(
                    "[data-time-grid]"
                );


            /*
             * 07:00 - 23:00
             * svakih 30 minuta
             */

            for (
                let minuta = 7 * 60;
                minuta <= 23 * 60;
                minuta += 30
            ) {

                /*
                 * OD ne može biti 23:00
                 */

                if (
                    input.id === "vrijeme-od" &&
                    minuta >= 23 * 60
                ) {
                    continue;
                }


                const sati =
                    Math.floor(
                        minuta / 60
                    );


                const minute =
                    minuta % 60;


                const vrijeme =
                    `${String(
                        sati
                    ).padStart(
                        2,
                        "0"
                    )}:${String(
                        minute
                    ).padStart(
                        2,
                        "0"
                    )}`;


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "kockica-time-button";


                if (
                    vrijeme ===
                    trenutnaVrijednost
                ) {

                    button.classList.add(
                        "selected"
                    );
                }


                button.textContent =
                    vrijeme;


                button.addEventListener(
                    "click",
                    () => {

                        input.value =
                            vrijeme;

                        zatvoriPicker();

                        input.focus();
                    }
                );


                grid.appendChild(
                    button
                );
            }


            pozicionirajPicker(
                picker,
                input
            );
        }


        /* =====================================================
           CLICK INPUT
        ===================================================== */

        if (datumInput) {

            datumInput.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    otvoriDatePicker();
                }
            );


            datumInput.addEventListener(
                "focus",
                () => {

                    if (
                        !aktivniPicker
                    ) {
                        otvoriDatePicker();
                    }
                }
            );
        }


        if (vrijemeOdInput) {

            vrijemeOdInput.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    otvoriTimePicker(
                        vrijemeOdInput
                    );
                }
            );


            vrijemeOdInput.addEventListener(
                "focus",
                () => {

                    if (
                        !aktivniPicker
                    ) {
                        otvoriTimePicker(
                            vrijemeOdInput
                        );
                    }
                }
            );
        }


        if (vrijemeDoInput) {

            vrijemeDoInput.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    otvoriTimePicker(
                        vrijemeDoInput
                    );
                }
            );


            vrijemeDoInput.addEventListener(
                "focus",
                () => {

                    if (
                        !aktivniPicker
                    ) {
                        otvoriTimePicker(
                            vrijemeDoInput
                        );
                    }
                }
            );
        }


        /* =====================================================
           ZATVARANJE PICKERA
        ===================================================== */

        document.addEventListener(
            "mousedown",
            event => {

                if (!aktivniPicker) {
                    return;
                }


                const clickedInside =
                    aktivniPicker.contains(
                        event.target
                    );


                const clickedInput =
                    event.target ===
                        datumInput ||
                    event.target ===
                        vrijemeOdInput ||
                    event.target ===
                        vrijemeDoInput;


                if (
                    !clickedInside &&
                    !clickedInput
                ) {

                    zatvoriPicker();
                }
            }
        );


        window.addEventListener(
            "resize",
            () => {

                if (!aktivniPicker) {
                    return;
                }


                const input =
                    document.activeElement;


                if (
                    input === datumInput ||
                    input === vrijemeOdInput ||
                    input === vrijemeDoInput
                ) {

                    pozicionirajPicker(
                        aktivniPicker,
                        input
                    );
                }
            }
        );


        window.addEventListener(
            "scroll",
            () => {

                if (!aktivniPicker) {
                    return;
                }


                const input =
                    document.activeElement;


                if (
                    input === datumInput ||
                    input === vrijemeOdInput ||
                    input === vrijemeDoInput
                ) {

                    pozicionirajPicker(
                        aktivniPicker,
                        input
                    );
                }
            },
            {
                passive: true
            }
        );


        /* =====================================================
           ADMIN FORMA
        ===================================================== */

        const editIdInput =
            document.getElementById(
                "edit-id"
            );


        const submitButton =
            document.getElementById(
                "submit-dugme"
            );


        const cancelEdit =
            document.getElementById(
                "otkazi-edit"
            );


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


        terminForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


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
                        "Odaberi ispravan datum."
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
                        "Odaberi ispravno vrijeme početka."
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
                        "Odaberi ispravno vrijeme završetka."
                    );

                    return;
                }


                /* RADNO VRIJEME */

                const noviOd =
                    vrijemeUMinutama(
                        vrijemeOd
                    );


                const noviDo =
                    vrijemeUMinutama(
                        vrijemeDo
                    );


                if (
                    noviOd < 7 * 60 ||
                    noviOd > 22 * 60 + 30
                ) {

                    alert(
                        "Početak termina mora biti između 07:00 i 22:30."
                    );

                    return;
                }


                if (
                    noviDo < 7 * 60 + 30 ||
                    noviDo > 23 * 60
                ) {

                    alert(
                        "Završetak termina mora biti između 07:30 i 23:00."
                    );

                    return;
                }


                /* OD < DO */

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


        if (cancelEdit) {

            cancelEdit.addEventListener(
                "click",
                resetAdminForm
            );
        }


        /* =====================================================
           ADMIN — POSTOJEĆI TERMINI
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


                    termini.forEach(
                        ([id, termin]) => {

                            const div =
                                document.createElement(
                                    "div"
                                );


                            div.className =
                                "admin-termin";


                            div.innerHTML = `

                                <div
                                    class="admin-termin-info"
                                >

                                    <div
                                        class="admin-termin-date"
                                    >

                                        ${escapeHtml(
                                            formatDatumZaPrikaz(
                                                termin.datum
                                            )
                                        )}

                                    </div>


                                    <div
                                        class="admin-termin-time"
                                    >

                                        ${escapeHtml(
                                            termin.vrijemeOd
                                        )}

                                        —

                                        ${escapeHtml(
                                            termin.vrijemeDo
                                        )}

                                    </div>

                                </div>


                                <div
                                    class="admin-termin-actions"
                                >

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

    }


    /* =========================================================
       JAVNA STRANICA
    ========================================================= */

    const schedule =
        document.querySelector(
            ".schedule"
        );


    /*
     * Ako nismo na javnoj stranici,
     * završavamo ovdje.
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
            !odabraniDatum
        ) {
            return;
        }


        const label =
            document.getElementById(
                "selectedDateLabel"
            );


        if (label) {

            label.textContent =
                formatDatumZaPrikaz(
                    odabraniDatum
                );

        } else if (
            selectedDateElement
        ) {

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


        daysContainer.innerHTML =
            "";


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
                    ).padStart(
                        2,
                        "0"
                    )}
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


        schedule.innerHTML =
            "";


        const pocetakDana =
            7 * 60;


        const krajDana =
            23 * 60;


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

                    <div
                        class="status-text ${
                            zauzeto
                                ? "status-busy"
                                : "status-free"
                        }"
                    >

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


            if (!odabraniDatum) {

                napraviDane();
            }


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