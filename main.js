function logoAnimation() {
    
    
    const logoContainer = document.getElementById('logo-container');
    if (!logoContainer) return;
    
    fetch('/svgFrames.html')
    .then(response => response.ok ? response.text() : Promise.reject(response.status))
    .then(data => {
        
        // Usa DOMParser per evitare problemi con SVG + innerHTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${data}</div>`, 'text/html');
        const svgs = doc.querySelectorAll('svg');
        
        svgs.forEach(svg => logoContainer.appendChild(svg));
        
        
        requestAnimationFrame(() => startStopMotion());
    })
    .catch(() => {
        // fallback: avoid GSAP warnings if frames are missing in build
    });
    function startStopMotion() {
        const frames = document.querySelectorAll('#logo-container .frame');
        
        
        const frameCount = frames.length;
        if (!frameCount) return;
        const frameDuration = 450; // 10fps
        
        // 🎲 Inizio da un frame casuale
        let current = Math.floor(Math.random() * frameCount);
        
        gsap.set(frames, { autoAlpha: 0 });
        gsap.set(frames[current], { autoAlpha: 1 });
        
        function showNextFrame() {
            const next = (current + 1) % frameCount;
            
            gsap.to(frames[next], { autoAlpha: 1, duration: 0 });
            gsap.to(frames[current], { autoAlpha: 0, duration: 0 });
            
            current = next;
            
            setTimeout(showNextFrame, frameDuration);
        }
        
        setTimeout(showNextFrame, frameDuration);
    }
}

function heartAnimation() {
    
    
    const heartContainer = document.getElementById('heart-container');
    if (!heartContainer) return;
    
    fetch('/heartSvgFrames.html')
    .then(response => response.ok ? response.text() : Promise.reject(response.status))
    .then(data => {
        
        // Usa DOMParser per evitare problemi con SVG + innerHTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${data}</div>`, 'text/html');
        const svgs = doc.querySelectorAll('svg');
        
        svgs.forEach((svg, index) => {
            svg.classList.add('heartFrame');
            svg.id = `frame-${index + 1}`;
            
            // Imposta dimensioni diverse (esempio arbitrario, puoi metterci qualsiasi logica)
            const widths = [90, 
                110,
                130, ]; // in px
                svg.style.width = `${widths[index]}px`;
                svg.style.height = 'auto';
                
                heartContainer.appendChild(svg);
            });
            
            
            
            requestAnimationFrame(() => startStopMotion());
        })
        .catch(() => {
            // fallback: avoid GSAP warnings if frames are missing in build
        });
        function startStopMotion() {
            const frames = document.querySelectorAll('#heart-container .heartFrame');
            const frameCount = frames.length;
            if (!frameCount) return;
            const defaultDuration = 220;
            
            let current = frameCount - 1;
            
            gsap.set(frames, { autoAlpha: 0 });
            gsap.set(frames[current], { autoAlpha: 1 });
            
            function showNextFrame() {
                const next = (current + 1) % frameCount;
                
                gsap.to(frames[next], { autoAlpha: 1, duration: 0 });
                gsap.to(frames[current], { autoAlpha: 0, duration: 0 });
                
                current = next;
                
                // Controlla se è frame-2 o frame-5 e assegna durata extra
                const currentId = frames[current].id;
                let duration = defaultDuration;
                
                if (currentId === 'frame-2' || currentId === 'frame-5') {
                    duration = 650; // tempo più lungo per questi frame
                }
                
                setTimeout(showNextFrame, duration);
            }
            
            setTimeout(showNextFrame, defaultDuration);
        }
        
    }
    
    let isExiting = false;
    let isCloneMode = false;
    
    const themeByIndex = {
        1: {
            bgColor: "#092920",
            accentColor: "#B7A4C2",
        },
        2: {
            bgColor: "#1c1c1cff",
            accentColor: "#f0f0ef",
        },
        3: {
            bgColor: "#0057FF",
            accentColor: "#F2F2F2",
        },
        4: {
            bgColor: "#E8540E",
            accentColor: "black",
        },
        5: {
            bgColor: "#632844",
            accentColor: "#D6E368",
        },
    };
    
    function applyThemeForIndex(index) {
        
        const theme = index != null ? themeByIndex[index] : {
            accentColor: "#282828",   // colore base per testo/icone
            bgColor: "#f0f0ef"        // sfondo base
        };
        
        if (!theme) return;
        
        // Cambia il colore del testo e icone
        gsap.to(".indiDeveloper div, .fContacts a, .fContacts ion-icon, .exploreButton, .miniTitlesContainer, .projectNameSquared, .otherTitle, .goLive, .returnButton, .goLive a,  .singlePhotoContainer, .menuVoices ", {
            color: theme.accentColor,
            duration: 0.6,
            ease: "power2.out"
        });
        
        
        gsap.to("#crxtian-hub_home, html", {
            backgroundColor: theme.bgColor,
            duration: 0.8,
            ease: "power2.out"
        });
        navSquares.forEach((sq, i) => {
            const isActive = parseInt(sq.dataset.index) === index;
            
            gsap.to(sq, {
                backgroundColor: isActive ? theme.accentColor : "transparent",
                duration: 0.1,
                ease: "cicr.out"
            });
        });
        gsap.to(".xDot, .pixelledSlash .dots", {
            backgroundColor: theme.accentColor,
            duration: 0.6,
            ease: "power2.out"
        });
        gsap.to(".navSquares, .rectangleActive", {
            borderColor: theme.accentColor,
            duration: .6,
            ease: "power2.out"
        });
        gsap.to("#logo-container", {
            fill: theme.accentColor,
            duration: 0.6,
            ease: "power2.out"
        });
        // letterOutline
        gsap.to(".letterOutline", {
            borderColor: theme.accentColor,
            duration: 0.6,
            ease: "power2.out"
        });
        
        
    }
    
    //code group Reveal Section ALL Animation START
    // ! group MENU WORK ABOUT section animation start
    
    document.addEventListener("DOMContentLoaded", () => {
        const menuVoices = document.querySelectorAll(".menuVoices");
        
        // Entrata iniziale delle voci dal basso
        gsap.from(menuVoices, {
            y: 100,
            opacity: 1,
            duration: 1.2,
            ease: "circ.out",
            delay: 1.3,
        });
        
        
    });
    
    
    function textRolling (){
        let elements = document.querySelectorAll('.rolling-text');
        
        elements.forEach((element)=>{
            let innerText = element.innerText;
            element.innerHTML ="";
            
            let textContainer = document.createElement("div");
            textContainer.classList.add("block");
            
            for(let letter of innerText){
                let span = document.createElement("span");
                span.innerText = letter.trim() === "" ? "\xa0" : letter;
                span.classList.add("letter");
                textContainer.appendChild(span);
            }
            
            element.appendChild(textContainer);
            element.appendChild(textContainer.cloneNode(true));
        });
        elements.forEach((element) =>{
            element.addEventListener("mouseover", ()=>{
            });
        })
    }
    textRolling();
    
    
    function rollingTextClicked() {
        
        const workVoice = document.querySelector(".workVoice")
        const aboutVoice = document.querySelector(".aboutVoice")
        const menuVoices = document.querySelectorAll(".menuVoices")
        
        
        workVoice.addEventListener("click",()=>{
            workVoice.classList.add("clicked")
            aboutVoice.classList.remove("clicked")
        })
        
        aboutVoice.addEventListener("click", () => {
            aboutVoice.classList.add("clicked");
            workVoice.classList.remove("clicked");
        })
        
        
        // vorrei adesso però capire se in questo momento una delle due voci ha la classe clicked? con il mouser over se non ce l'ha gli si mette e l'altra lo toglie
        
        
        
    }
    
    rollingTextClicked();
    
    
    
    
    
    gsap.from(".dots",{
        duration: .4,
        ease: "back.out(.7)",
        scale: 0,
        delay: .5,
        stagger:.25,
    });
    
    
    document.addEventListener("DOMContentLoaded", () => {
        const menuWA = document.querySelector(".menuWA");
        const workVoice = document.querySelector(".workVoice")
        const aboutVoice = document.querySelector(".aboutVoice")
        
        workVoice.addEventListener("click", () => {
            menuWA.classList.add("scaled");
            
            setTimeout(() => {
                workSectionAnimation();
                
            }, 500);
        });
        
        
        
        aboutVoice.addEventListener("click", () => {
            menuWA.classList.add("scaled");
            
            setTimeout(() => {
                aboutSectionAnimation();
                
            }, 500);
        });
        
    });
    
    // ! group MENU WORK ABOUT section animation ending
    
    
    // ! group freak / about section animation start
    document.addEventListener("DOMContentLoaded", () => {
        const freak = document.querySelector('.FREAK');
        const copyright = document.querySelector('.copyright');
        const home = document.getElementById('crxtian-hub_home');
        const planetLogo = document.getElementById('logo-container');
        const heart = document.getElementById('heart-container');
        const lines = document.querySelectorAll('.lineCancelling');
        
        freak.addEventListener('mouseenter', () => {
            home.classList.add('hovered');
            freak.classList.add('hovered');
            planetLogo.classList.add('hovered');
            heart.classList.add('hovered');
            copyright.classList.add('hovered');
            lines.forEach(line => line.classList.add('hovered'));
            document.querySelectorAll('.colored').forEach(el => el.classList.add('hovered'));
            
            
        });
        
        freak.addEventListener('mouseleave', () => {
            home.classList.remove('hovered');
            freak.classList.remove('hovered');
            planetLogo.classList.remove('hovered');
            heart.classList.remove('hovered');
            copyright.classList.remove('hovered');
            lines.forEach(line => line.classList.remove('hovered'));
            document.querySelectorAll('.colored').forEach(el => el.classList.remove('hovered'));
        });
        
        heartAnimation()
    });
    // ! group freak / about section animation ending
    
    
    // ! group about section animation start
    
    function aboutSectionAnimation() {
        const aboutSection = document.querySelector("#aboutSection");
        const workSection = document.querySelector("#workSection");
        const floatingClone = document.querySelector(".floatingClone")
        const floatingSlide = document.querySelectorAll(".floatingSlide img")
        
        
        // applyThemeForIndex(null);
        floatingSlide.forEach(singleSlide => {
            singleSlide.addEventListener("mouseover", ()=>{
                console.log("ciao");
                
            })
        });
        
        
        
        
        
        
        
        // === MINI TITLES ===
        document.querySelectorAll('.animationMiniTitles').forEach(el => {
            const children = el.querySelectorAll('div');
            
            if (children.length > 0) {
                children.forEach(child => {
                    const wrapper = document.createElement('div');
                    wrapper.classList.add('wrapperanimationMiniTitles');
                    
                    const inner = document.createElement('div');
                    inner.classList.add('animatedMiniTitle');
                    inner.textContent = child.textContent;
                    
                    wrapper.appendChild(inner);
                    child.textContent = '';
                    child.appendChild(wrapper);
                });
            } else {
                const wrapper = document.createElement('div');
                wrapper.classList.add('wrapperanimationMiniTitles');
                
                const inner = document.createElement('div');
                inner.classList.add('animatedMiniTitle');
                inner.textContent = el.textContent;
                
                wrapper.appendChild(inner);
                el.textContent = '';
                el.appendChild(wrapper);
            }
        });
        
        gsap.to('.animatedMiniTitle', {
            y: 0,
            duration: 1.3,
            ease: "circ.out",
        });
        
        // === LETTER WRAPPER BIO===
        const targets = document.querySelectorAll('.wrapEveryChar > div');
        
        targets.forEach(line => {
            const nodes = Array.from(line.childNodes);
            line.textContent = '';
            
            nodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent.split('').forEach(char => {
                        const mask = document.createElement('span');
                        mask.classList.add('text-mask');
                        
                        const span = document.createElement('span');
                        span.classList.add('char-animated');
                        span.textContent = char === ' ' ? '\u00A0' : char;
                        
                        mask.appendChild(span);
                        line.appendChild(mask);
                    });
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const nodeClasses = [...node.classList];
                    node.textContent.split('').forEach(char => {
                        const mask = document.createElement('span');
                        mask.classList.add('text-mask');
                        
                        const span = document.createElement('span');
                        span.classList.add('char-animated', ...nodeClasses);
                        span.textContent = char === ' ' ? '\u00A0' : char;
                        
                        mask.appendChild(span);
                        line.appendChild(mask);
                    });
                }
            });
        });
        
        gsap.set('.char-animated', { x: '-100%' });
        gsap.to('.char-animated', {
            x: 0,
            opacity: 1,
            duration: 1,
            ease: "circ.out",
        });
        
        // === FREAK ===
        gsap.from(".FREAK", {
            delay: 1,
            duration: 1,
            autoAlpha: 0,
        });
        
        // === FULL TEXT WRAPPER ===
        const el = document.querySelector('.wrapFullText');
        if (el) {
            const icon = el.querySelector('ion-icon');
            const text = el.childNodes[0]?.textContent?.trim() || "";
            el.textContent = '';
            
            const mask = document.createElement('span');
            mask.classList.add('wrapper-mask');
            
            const inner = document.createElement('span');
            inner.classList.add('animated-block');
            inner.textContent = text;
            
            if (icon) {
                const iconClone = icon.cloneNode(true);
                inner.appendChild(iconClone);
            }
            
            mask.appendChild(inner);
            el.appendChild(mask);
            
            gsap.to(inner, {
                y: 0,
                duration: 1.3,
                ease: "circ.out",
            });
        }
        
        aboutSection.classList.add("toShow")
        aboutSection.classList.remove("toHide")
        
        workSection.classList.add("toHide")
        workSection.classList.remove("toShow")
        
        floatingClone?.classList.add("toHide");
        floatingClone?.classList.remove("toShow");
        
    }
    
    
    // ! group about section animation ending
    
    
    // ! group WORK section animation start
    
    function workSectionAnimation() {
        
        const workSection = document.querySelector("#workSection");
        const aboutSection = document.querySelector("#aboutSection");
        const floatingClone = document.querySelector(".floatingClone")
        const floatingSlide = document.querySelectorAll(".floatingSlide img")
        
        
        workSection.classList.add("toShow")
        workSection.classList.remove("toHide")
        
        aboutSection.classList.add("toHide")
        aboutSection.classList.remove("toShow")
        
        setTimeout(() => {
            if (!floatingClone) return;  // sicurezza 😎
            
            floatingClone.classList.add("toShow");
            floatingClone.classList.remove("toHide");
        }, 1);
        
        gsap.from(".navSquares", {
            duration: 1.3,
            ease: "power2.out",
            x: 50,
            stagger:.08,
        });
        
        gsap.from(".singleSlide", {
            duration: 1.3,
            ease: "power2.out",
            x: 1200,
            stagger:.08,
            pointerEvents:"none",
            onComplete: () => {
                document.querySelectorAll(".singleSlide").forEach(slide => {
                    slide.style.pointerEvents = "all";
                });
            }
        });
        
    }
    
    
    // ! group WORK section animation END
    
    
    
    // code ANIMATION THAT ARE AFTER PRELOADING
    
    document.addEventListener("DOMContentLoaded", () => {
        // 🧱 Wrappa testo in .indiDeveloper
        document.querySelectorAll('.socials').forEach(social => {
            const icon = social.querySelector('ion-icon');
            
            social.addEventListener('mouseenter', () => {
                gsap.to(icon, {
                    rotate: 135,
                    opacity: 1, // mostra e imposta opacity + visibility
                    duration: 0.3,
                    ease: "back.out(1.7)"
                });
            });
            
            social.addEventListener('mouseleave', () => {
                gsap.to(icon, {
                    opacity: 0, // nasconde con opacity + visibility
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
        });
        
        
        
        document.querySelectorAll('.indiDeveloper > div').forEach(line => {
            const text = line.textContent;
            line.textContent = '';
            
            const mask = document.createElement('span');
            mask.classList.add('mask-wrapper');
            
            const inner = document.createElement('span');
            inner.classList.add('from-below-indipendent');
            inner.textContent = text;
            
            mask.appendChild(inner);
            line.appendChild(mask);
        });
        
        // 🧱 Wrappa SOLO il testo del link dei social (non l'icona)
        document.querySelectorAll('.fContacts .socials').forEach(social => {
            const icon = social.querySelector('ion-icon');
            const link = social.querySelector('a');
            
            // WRAP il contenuto testuale del link
            const linkText = link.textContent;
            link.textContent = '';
            
            const mask = document.createElement('span');
            mask.classList.add('mask-wrapper');
            
            const span = document.createElement('span');
            span.classList.add('from-below-socials');
            span.textContent = linkText;
            
            mask.appendChild(span);
            link.appendChild(mask);
            
            
        });
        
        // 🎬 ANIMAZIONE
        gsap.set('.from-below-socials, .from-below-indipendent', { y: '100%', autoAlpha: 0 });
        
        gsap.to('.from-below-socials, .from-below-indipendent', {
            y: 0,
            autoAlpha: 1,
            duration: 0.6,
            ease: 'circ.out',
            stagger: 0.05,
            delay: 0.6
        });
    });
    
    gsap.from(".logotype svg", {
        y: 50,
        duration: 0.6,
        ease: 'circ.out',
        delay: 0.4,
    });
    
    gsap.from("#logo-container", {
        //   autoAlpha: 0,
        duration: 2.5,
        ease: 'circ.inOut',
        delay: 0.4,
        scale: 0,
    });
    gsap.from(".prelXDot4", {
        duration: 1,
        ease: 'circ.inOut',
        scale: 0,
    });
    gsap.from(".prelXDot1,.prelXDot2,.prelXDot3,.prelXDot5", {
        duration: .4,
        ease: "back.out(.7)",
        scale: 0,
        delay: .6,
    });
    // gsap.from(".prelSlashDot3,.prelSlashDot1,.prelSlashDot2", {
    //     duration: .4,
    //     ease: "back.out(.7)",
    //     scale: 0,
    //     delay: .8,
    //     stagger:.25,
    // });
    //code group Reveal Section ALL Animation ending
    
    
    
    
    
    
    
    
    // ! Base Carousel ("Singleslide")
    const navSquares = document.querySelectorAll('.navSquares');
    const carousel = document.getElementById('carousel');
    const slides = document.querySelectorAll('.singleSlide');
    const slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(carousel).gap || 0);
    const totalWidth = slideWidth * slides.length;
    let targetScroll = 0;
    let currentScroll = 0;
    
    // Set initial active
    // navSquares[0].classList.add('active');
    
    function updateNavSquaresForClones(index) {
        navSquares.forEach((sq) => {
            const sqIndex = parseInt(sq.dataset.index);
            const isMatch = sqIndex === index;
            
            sq.classList.toggle("clones", isMatch);
            sq.classList.toggle("active", isMatch);
        });
    }
    
    
    // CLICK: imposta scroll target invece di trasformare direttamente
    navSquares.forEach((square, index) => {
        square.addEventListener('click', () => {
            if (isCloneMode) {
                animateToIndex(index + 1); // cambia slide clonata (data-index parte da 1)
            } else {
                targetScroll = index * slideWidth;
                targetScroll = Math.max(0, Math.min(targetScroll, totalWidth - slideWidth));
            }
        });
    });
    
    
    // SCROLL: modifica targetScroll in base alla rotella
    function handleSmoothScroll(event) {
        if (isCloneMode) {
            event.preventDefault(); // blocca lo scroll
            return;
        }
        
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
        
        targetScroll += delta * 0.5;
        targetScroll = Math.max(0, Math.min(targetScroll, totalWidth - slideWidth));
    }
    
    // todo qua viene gestito l'animazione dello scroll.
    
    // ANIMAZIONE fluida: LERP tra current e target
    function animate() {
        currentScroll += (targetScroll - currentScroll) * 0.1;
        
        carousel.style.transform = `translateX(calc(42.5vw - 42.5vw - ${currentScroll}px)) translateY(-50%)`;
        
        // calcola forza normalizzata (0 → 1)
        const scrollForce = Math.min(1, Math.abs(targetScroll - currentScroll) / slideWidth);
        
        // calcola deformazione
        const scaleX = 1 - scrollForce * .3; // max 30% più larga
        const scaleY = 1 - scrollForce * .6; // max 20% più bassa
        
        slides.forEach(slide => {
            if (!slide.classList.contains("clone")) {
                const extraGap = scrollForce * 1.5; // fino a +2vw extra margine
                gsap.to(slide, {
                    scaleX,
                    scaleY,
                    marginLeft: `${extraGap}vw`,
                    marginRight: `${extraGap}vw`,
                    duration: 0.2,
                    ease: "power2.out"
                });
            }
        });
        
        
        if (!isCloneMode) {
            const newIndex = Math.round(currentScroll / slideWidth);
            navSquares.forEach((sq, i) => {
                sq.classList.toggle('active', i === newIndex);
            });
        }
        
        requestAnimationFrame(animate);
    }
    
    
    
    
    
    animate();
    window.addEventListener('wheel', handleSmoothScroll, { passive: false });
    
    
    
    
    carousel.addEventListener('touchmove', (e) => {
        if (!touchStartX) return;
        const touchEndX = e.touches[0].clientX;
        const deltaX = touchStartX - touchEndX;
        
        if (Math.abs(deltaX) > 20) { // soglia per evitare falsi swipe
            if (deltaX > 0) targetScroll += slideWidth;     // swipe sinistra
            else targetScroll -= slideWidth;                // swipe destra
            targetScroll = Math.max(0, Math.min(targetScroll, totalWidth - slideWidth));
            touchStartX = null; // reset dopo lo swipe
        }
    });
    
    
    // ! Base Carousel ("Singleslide") ENDING
    
    
    
    
    
    
    
    
    //! START clicking slides
    let clones = [];
    let isAnimating = false;
    let isFirstOpen = true;
    let currentIndex = null;
    
    
    
    function cloneAllSlides(clickedIndex) {
        if (!isFirstOpen || isAnimating) return;
        isFirstOpen = false;
        currentIndex = clickedIndex;
        isCloneMode = true;
        
        // Aggiorna navSquares attivo qui
        updateNavSquaresForClones(clickedIndex);
        
        const slides = [...document.querySelectorAll(".singleSlide")];
        
        slides.forEach((slide) => {
            
            const rect = slide.getBoundingClientRect();
            const clone = slide.cloneNode(true);
            const realIndex = parseInt(slide.dataset.index);
            
            clone.classList.add("floatingSlide");
            clone.classList.remove("originalSlide");
            clone.dataset.index = realIndex;
            clone.dataset.originalIndex = realIndex;
            
            if (realIndex === clickedIndex) {
                clone.classList.add("activeSlide");
            } else {
                clone.classList.add("inactiveSlide");
            }
            
            document.body.appendChild(clone);
            
            gsap.set(clone, {
                position: "fixed",
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                xPercent: 0,
                yPercent: 0,
                margin: 0,
                zIndex: realIndex === clickedIndex ? 1002 : 999,
            });
            
            clone.addEventListener("click", () => {
                if (realIndex !== currentIndex) animateToIndex(realIndex);
            });
            
            clone.dataset.cloneIndex = realIndex;
            clones.push(clone);
        });
        
        document.querySelectorAll(".singleSlide").forEach((el) => {
            if (!el.classList.contains("floatingSlide")) {
                el.style.visibility = "hidden";
            }
        });
        
        positionClones(clickedIndex);
        showProjectInfo(clickedIndex);
        applyThemeForIndex(clickedIndex);
    }
    
    
    function positionClones(centerIndex) {
        const baseLeft = 50;
        const spacing = 56;
        clones.forEach((clone) => {
            const realIndex = parseInt(clone.dataset.index);
            const offset = realIndex - centerIndex;
            clone.dataset.offset = offset;
            
            
            
            const position = offset === 0 ? "center" : offset < 0 ? "left" : "right";
            const left = `calc(${baseLeft}vw + ${offset * spacing}vw)`;
            const top = "46vh";
            const z = offset === 0 ? 1002 : 999;
            gsap.to(".logotype",{
                opacity:0,
            })
            
            gsap.to("#logo-container",{
                width:"62.5px",
                height:"62.5px",
                ease:"power.out",
                duration:.5,
            })
            
            gsap.to(clone, {
                left,
                top,
                width: "47vw",
                height: "25vw",
                xPercent: -50,
                yPercent: -50,
                ease: "circ.out",
                duration: 0.8,
                zIndex: z,
            });
        });
    }
    
    
    
    function attachCloneListeners() {
        
        
        clones.forEach((clone) => {
            const realIndex = parseInt(clone.dataset.index);
            if (realIndex !== currentIndex) {
                animateToIndex(realIndex);
            }
            const offset = realIndex - currentIndex;
            const originalIndex = parseInt(clone.dataset.originalIndex);
            
            // Rimuovi eventuali listener duplicati
            clone.onclick = null;
            
            clone.onclick = () => {
                if (isAnimating) return;
                
                
                
                if (offset === 0) {
                    
                    return;
                }
                
                const newIndex = currentIndex + offset;
                
                animateToIndex(newIndex);
            };
            
            // Log descrittivo per capire chi è chi
            if (offset === 0) {
                
            } else if (offset < 0) {
                
            } else {
                
            }
        });
    }
    
    let totalSlides = document.querySelectorAll(".singleSlide").length;
    
    
    function updateActiveSlide(newIndex) {
        clones.forEach(clone => {
            const index = parseInt(clone.dataset.index);
            if (index === newIndex) {
                clone.classList.add("activeSlide");
                clone.classList.remove("inactiveSlide");
            } else {
                clone.classList.remove("activeSlide");
                clone.classList.add("inactiveSlide");
            }
        });
    }
    
    function animateToIndex(newIndex) {
        
        if (isAnimating || newIndex === currentIndex || newIndex < 0 || newIndex > totalSlides) {
            
            return;
        }
        isAnimating = true;
        
        
        positionClones(newIndex);
        updateActiveSlide(newIndex);
        applyThemeForIndex(newIndex);
        updateNavSquaresForClones(newIndex);
        
        
        setTimeout(() => {
            currentIndex = newIndex;
            showProjectInfo(newIndex);
            attachCloneListeners(currentIndex);
            isAnimating = false;
        }, 20);
    }
    
    
    // FUNZIONE PER GESTIRE IL RITORNO ALLA GRIGLIA CON ESC
    
    
    function restoreOriginalGrid() {
        
        clones.forEach((clone) => {
            const original = document.querySelector(`.singleSlide[data-index='${clone.dataset.originalIndex}']`);
            const rect = original.getBoundingClientRect();
            
            gsap.to(clone, {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                xPercent: 0,
                yPercent: 0,
                duration: 0.5,
                ease: "power2.inOut",
                onComplete: () => {
                    clone.remove();
                    document.querySelectorAll(".singleSlide").forEach((el) => {
                        el.style.display = "block";
                        el.style.visibility = "visible";
                        
                    });
                }
            });
            gsap.to(".logotype",{
                opacity:1,
            })
            gsap.to("#logo-container",{
                width:"110px",
                height:"110px",
                ease:"circ.in",
                duration:.2,
            })
            gsap.to(".navSquares",{
                backgroundColor:"transparent"
            })
        });
        
        // Reset variabili
        clones = [];
        isFirstOpen = true;
        isAnimating = false;
        isCloneMode = false;
        currentIndex = null;
        navSquares.forEach(sq => sq.classList.remove("clones", "active"));
        navSquares[0].classList.add("active"); // o quello che preferisci
    }
    
    
    let escLockedUntil = 0;
    
    document.addEventListener('click', (e) => {
        if (e.target.closest('.floatingSlide')) {
            escLockedUntil = Date.now() + 200;
        }
    });
    
    // ESC listener
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" || e.key === "ArrowUp") {
            const now = Date.now();
            if (now < escLockedUntil || !isEscEnabled) return; // ESC bloccato
            
            if (isAnimatingProjectInfo) {
                gsap.killTweensOf(".fromBotAnim");
                gsap.killTweensOf(".letterSquare");
                
                document.querySelectorAll(".projectInfo").forEach((info) => {
                    info.classList.remove("active");
                });
                
                isAnimatingProjectInfo = false;
                applyThemeForIndex(null);
                restoreOriginalGrid();
                return;
            }
            
            restoreOriginalGrid();
        }
    });
    
    
    document.querySelectorAll(".singleSlide").forEach((slide) => {
        slide.addEventListener("click", () => {
            const selectedIndex = parseInt(slide.dataset.index);
            cloneAllSlides(selectedIndex);
        });
    });
    
    
    
    
    
    
    let isAnimatingProjectInfo = false;
    
    
    // Logica per i titoli dei quadrat
    
    
    
    
    function generateSquaredTitles(container = document) {
        container.querySelectorAll(".projectNameSquared > div").forEach((line) => {
            if (line.dataset.generated === "true") return; // già generato → salta
            line.dataset.generated = "true";
            
            const text = line.textContent;
            line.textContent = "";
            line.classList.add("projectLine");
            
            [...text].forEach(char => {
                if (char === " ") {
                    const spacer = document.createElement("div");
                    spacer.classList.add("letterSquare", "isSpace");
                    spacer.style.width = "5.17vw";
                    spacer.style.height = "5.17vw";
                    line.appendChild(spacer);
                    return;
                }
                
                const wrapper = document.createElement("div");
                wrapper.classList.add("letterSquare");
                
                const outline = document.createElement("div");
                outline.classList.add("letterOutline");
                
                const span = document.createElement("span");
                span.textContent = char;
                
                wrapper.appendChild(outline);
                wrapper.appendChild(span);
                line.appendChild(wrapper);
            });
        });
    }
    
    
    generateSquaredTitles();
    const letters = [...document.querySelectorAll(".letterSquare")];
    const shuffled = letters.sort(() => Math.random() - 0.5);
    gsap.from(shuffled, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: {
            each: 0.03,
        },
    });
    
    
    
    
    function showProjectInfo(index) {
        
        isAnimatingProjectInfo = true;
        const allInfos = document.querySelectorAll(".projectInfo");
        const currentActive = document.querySelector(".projectInfo.active");
        
        // Se esiste un elemento già attivo, animiamo la sua uscita prima di mostrarne uno nuovo
        if (currentActive) {
            const fromBotOutEls = currentActive.querySelectorAll(".fromBotAnim");
            const squaredOut = currentActive.querySelector(".projectNameSquared");
            
            // Anima l'uscita
            gsap.to(fromBotOutEls, {
                y: -40,
                duration: 0.3,
                stagger: 0.01,
                ease: "power1.Out",
                stagger: 0.01,
            });
            
            if (squaredOut) {
                gsap.to(squaredOut.querySelectorAll(".letterSquare"), {
                    opacity: 0,
                    duration: .1,
                    ease: "power1.in",
                });
            }
            
            // Dopo un piccolo delay, nascondi e mostra il nuovo
            setTimeout(() => {
                allInfos.forEach((info) => info.classList.remove("active"));
                
                const target = document.querySelector(`.projectInfo[data-index="${index}"]`);
                if (target) {
                    target.classList.add("active");
                    
                    // STEP 1 — Wrap se non già fatto
                    const fromBotEls = target.querySelectorAll(".fromBotAnim");
                    fromBotEls.forEach((el) => {
                        if (!el.parentElement.classList.contains("wrapperFromBotAnim")) {
                            const wrapper = document.createElement("div");
                            wrapper.classList.add("wrapperFromBotAnim");
                            el.parentNode.insertBefore(wrapper, el);
                            wrapper.appendChild(el);
                            wrapper.style.overflow = "hidden";
                        }
                    });
                    
                    // STEP 2 — Entra .fromBotAnim
                    gsap.fromTo(
                        fromBotEls,
                        { y: 40, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.5,
                            stagger: 0.03,
                            ease: "power3.out"
                        }
                    );
                    
                    // STEP 3 — Genera e anima lettere squared
                    const nameSquared = target.querySelector(".projectNameSquared");
                    if (nameSquared) {
                        // generateSquaredTitles(nameSquared);
                        
                        const letters = [...nameSquared.querySelectorAll(".letterSquare")];
                        const shuffled = letters.sort(() => Math.random() - 0.5);
                        
                        gsap.fromTo(
                            shuffled,
                            { opacity: 0 },
                            {
                                opacity: 1,
                                duration: 0.2,
                                ease: "power2.out",
                                stagger: 0.02,
                                zIndex:1009,
                                
                            }
                        );
                    }
                }
                
            }, 350); // Delay per far finire l'uscita prima di cambiare slide
        } else {
            // Nessuna info attiva (prima volta) → mostra direttamente
            const target = document.querySelector(`.projectInfo[data-index="${index}"]`);
            if (target) {
                target.classList.add("active");
                
                const fromBotEls = target.querySelectorAll(".fromBotAnim");
                fromBotEls.forEach((el) => {
                    if (!el.parentElement.classList.contains("wrapperFromBotAnim")) {
                        const wrapper = document.createElement("div");
                        wrapper.classList.add("wrapperFromBotAnim");
                        el.parentNode.insertBefore(wrapper, el);
                        wrapper.appendChild(el);
                        wrapper.style.overflow = "hidden";
                    }
                });
                
                gsap.fromTo(
                    fromBotEls,
                    { y: 40, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 1.1,
                        delay: .5,
                        stagger: 0.07,
                        ease: "power3.out"
                    }
                );
                
                const nameSquared = target.querySelector(".projectNameSquared");
                if (nameSquared) {
                    generateSquaredTitles(nameSquared);
                    
                    const letters = [...nameSquared.querySelectorAll(".letterSquare")];
                    const shuffled = letters.sort(() => Math.random() - 0.5);
                    
                    gsap.fromTo(
                        shuffled,
                        { opacity: 0 },
                        {
                            opacity: 1,
                            duration: 0.4,
                            ease: "power2.out",
                            stagger: 0.02,
                            delay: .4,
                            zIndex:400,
                        }
                    );
                }
            }
        }
        
    }
    
    
    
    
    
    
    
    
    
    let activeFloatingClone = null;
    let lastIndex = 0;
    let isGalleryReady = false;
    let isNewExploreClick = false;
    
    function cloneAndAnimateImage(img, index) {
        isEscEnabled = false;
        const container = img.closest(".allPhotosToSeeContainer");
        const rectangle = container.querySelector(".rectangleActive");
        
        // Sposta rettangolo
        const newTop = -0.1 + index * 4.3;
        gsap.to(rectangle, {
            top: `${newTop}vw`,
            duration: 0.5,
            ease: "circ.out"
        });
        
        // Elimina clone vecchio se esiste
        if (activeFloatingClone) {
            const oldClone = activeFloatingClone; // 🧠 fix importante
            gsap.to(oldClone, {
                top: index > lastIndex ? "-70%" : "138%",
                opacity: 1,
                duration: 1.5,
                ease: "circ.out",
                onComplete: () => oldClone.remove()
            });
        } 
        // Clona immagine
        const clone = img.cloneNode(true);
        clone.classList.add("floatingClone");
        document.body.appendChild(clone);
        
        const startTop = isNewExploreClick && index === 0 ? "200%" : (activeFloatingClone === null ? "200%" : (index > lastIndex ? "130%" : "-100%"));
        
        Object.assign(clone.style, {
            position: "fixed",
            top: startTop,
            left: "50%",
            width: "47vw",
            height: "25vw",
            objectFit: "contain",
            //code FLOATINGCLONEOBJECTFIT
            transform: "translate(-50%, -50%)",
            zIndex: 1,
            opacity: 1,
        });
        
        // Anima clone
        gsap.to(clone, {
            top: "46%",
            duration: 1,
            ease: "circ.out"
        });
        
        activeFloatingClone = clone;
        lastIndex = index;
        isNewExploreClick = false;
    }
    
    
    
    
    // Listener click più snello
    document.querySelectorAll(".singlePhoto img").forEach(img => {
        img.addEventListener("click", () => {
            if (!isGalleryReady) return; // 🛑 Blocca se non pronto
            
            const index = parseInt(img.dataset.index);
            cloneAndAnimateImage(img, index);
        });
    });
    
    //! start explore clicking slides
    
    let splitInstance = null;
    
    function animateOtherTitle() {
        // 🔁 Se esiste già uno SplitText precedente → distruggilo
        if (splitInstance) {
            splitInstance.revert();
            splitInstance = null;
        }
        
        // 🆕 Ricrea SplitText da zero
        splitInstance = new SplitText(".otherTitle div", {
            type: "lines, chars",
            linesClass: "line",
            charsClass: "char"
        });
        
        splitInstance.lines.forEach((line) => {
            const chars = line.querySelectorAll(".char");
            
            // Wrappa se non già wrappato
            if (!chars[0]?.parentElement.classList.contains("charWrapper")) {
                chars.forEach((char) => {
                    const wrapper = document.createElement("div");
                    wrapper.classList.add("charWrapper");
                    char.parentNode.insertBefore(wrapper, char);
                    wrapper.appendChild(char);
                });
            }
            
            // ✨ Animazione GSAP
            gsap.fromTo(
                chars,
                { x: -40, opacity: 0 },
                {
                    x: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: "power3.out",
                    stagger: {
                        each: 0.03,
                        from: "start"
                    },
                }
            );
        });
    }
    
    function cleanOldSplitText() {
        document.querySelectorAll(".charWrapper").forEach((wrapper) => {
            const char = wrapper.querySelector(".char");
            if (char) wrapper.parentElement.insertBefore(char, wrapper);
            wrapper.remove();
        });
    }
    
    let isEscEnabled = true; // ESC abilitato all’inizio
    
    // ExploreButton: disabilita ESC
    document.querySelectorAll(".exploreButton").forEach((btn) => {
        btn.addEventListener("click", () => {
            const index = btn.dataset.index;
            const correspondingOtherInfo = document.querySelector(`.otherProjectInfos[data-index="${index}"]`);
            if (!correspondingOtherInfo) return;
            
            showOtherProjectInfos(index);
            cleanOldSplitText();
            animateOtherTitle();
            
            isNewExploreClick = true;
            isGalleryReady = true;
            
            isEscEnabled = false; // ❌ disabilita ESC
        });
    });
    
    
    
    let isAnimatingOtherInfo = false;
    
    
    
    
    function showOtherProjectInfos(index) {
        const currentInfo = document.querySelector(`.projectInfo[data-index="${index}"]`);
        const otherInfos = currentInfo?.querySelector(`.otherProjectInfos[data-index="${index}"]`);
        if (!currentInfo || !otherInfos) return;
        
        const squaredOut = currentInfo.querySelector(".projectNameSquared");
        
        // 1. 🧼 Anima uscita degli elementi attuali
        
        if (squaredOut) {
            gsap.to(squaredOut.querySelectorAll(".letterSquare"), {
                opacity: 0,
                duration: 0.2,
                ease: "circ.in",
            });
        }
        
        // 2. ⏳ Dopo il delay, mostra e anima la sezione otherProjectInfos
        setTimeout(() => {
            otherInfos.style.display = "block";
            
            // 🧱 Avvolgi gli elementi .fromBotAnim se non già fatto
            const newFromBot = otherInfos.querySelectorAll(".fromBotAnim");
            newFromBot.forEach((el) => {
                if (!el.parentElement.classList.contains("wrapperFromBotAnim")) {
                    const wrapper = document.createElement("div");
                    wrapper.classList.add("wrapperFromBotAnim");
                    el.parentNode.insertBefore(wrapper, el);
                    wrapper.appendChild(el);
                    wrapper.style.overflow = "hidden";
                }
            });
            
            // 📸 Anima la galleria laterale
            gsap.from(otherInfos.querySelector(".allPhotosToSeeContainer"), {
                y: 350,
                ease: "circ.out",
                opacity: 0,
                duration: 1,
                
            });
            gsap.to(".exploreButton",{
                y:-20,
                duration:.5,
                ease: "circ.out",
            })
            
            
            // 🖼️ Anima le singole foto con stagger
            gsap.from(otherInfos.querySelectorAll(".singlePhotoContainer"), {
                y: 60,
                opacity: 0,
                duration: 0.8,
                ease: "circ.in",
                stagger: 0.1
            });
            
            gsap.to(".navSquares",{
                opacity:0,
                duration:.1,
                pointerEvents:"none",
            })
            // 💨 Spingi le inactive slide (es: carosello dietro) in alto
            gsap.to(".inactiveSlide", {
                y: "-600%",
                duration: 0.4,
                ease: "circ.in"
            });
            gsap.to(".activeSlide", {
                y: "-600%",
                duration: 0.7,
                ease: "circ.in"
            });
            const firstImg = otherInfos.querySelector('.singlePhoto img[data-index="0"]');;
            if (firstImg) cloneAndAnimateImage(firstImg, 0);
        }, 20); // Delay per dare tempo all'uscita
    }
    
    
    
    document.querySelectorAll(".returnButton").forEach((btn) => {
        btn.addEventListener("click", () => {
            const projectInfo = btn.closest(".projectInfo");
            if (!projectInfo) return;
            
            const index = projectInfo.dataset.index;
            hideOtherProjectInfos(index);
            
            isEscEnabled = true; // ✅ riabilita ESC
        });
    });
    
    function hideOtherProjectInfos(index) {
        const currentInfo = document.querySelector(`.projectInfo[data-index="${index}"]`);
        const otherInfos = currentInfo?.querySelector(`.otherProjectInfos[data-index="${index}"]`);
        if (!currentInfo || !otherInfos) return; 
        const floatingClone = document.querySelectorAll(".floatingClone");
        
        gsap.to(otherInfos, {
            opacity: 0,
            duration: .2,
            ease: "circ.inOut",
            onComplete: () => {
                // 🧼 2. Nascondi dopo l'animazione
                otherInfos.style.display = "none";
                otherInfos.style.opacity = ""; 
                otherInfos.style.transform = ""; 
                
                
                // 🔁 3. Riattiva lettere nel titolo principale
                const squaredTitle = currentInfo.querySelector(".projectNameSquared");
                if (squaredTitle) {
                    const letters = [...squaredTitle.querySelectorAll(".letterSquare")];
                    const shuffled = letters.sort(() => Math.random() - 0.5);
                    
                    gsap.fromTo(
                        shuffled,
                        { opacity: 0 },
                        {
                            opacity: 1,
                            duration: 0.3,
                            stagger: 0.02,
                            ease: "power1.out"
                        }
                    );
                }
                
                // 📍 4. Ripristina slide
                gsap.to(".inactiveSlide", {
                    y: "0%",
                    duration: 0.4,
                    ease: "power1.out"
                });
                gsap.to(".activeSlide", {
                    y: "0%",
                    duration: 0.7,
                    ease: "circ.out"
                });
                
                gsap.to(".rectangleActive", {
                    top: "-.5vw"
                });
                
                gsap.to(".navSquares", {
                    opacity: 1,
                    duration: 0.1,
                    pointerEvents:"all"
                });
                
                // 🔙 5. Riporta exploreButton
                gsap.to(".exploreButton", {
                    y: 0,
                    duration: 0.4,
                    ease: "circ.out"
                });
            }
        });
        
        gsap.to(floatingClone,{
            y:50,
            duration:2,
        });
        
        // 🧹 6. Rimuove clone fluttuante
        gsap.to(floatingClone, {
            y: 600,
            duration: .7,
            ease: "circ.inOut",
            onComplete: () => {
                floatingClone.forEach(el => el.remove());
            }
        });
    }
    
    //! EDNING explore clicking slides
    
    
    
    
    // chiamata delle funzioni
    logoAnimation();
    
    
