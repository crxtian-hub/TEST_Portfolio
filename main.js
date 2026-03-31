import barba from '@barba/core';

let hasPlayedHomeSquaresIntro = false;
let hasPlayedHomeLoader = false;
let homeLoaderPromise = null;

const HOME_LOADER_FRAME_PATHS = [
    'preloader_svg/1_moon.svg',
    'preloader_svg/2_skull.svg',
    'preloader_svg/3_three.svg',
    'preloader_svg/4_pizza.svg',
    'preloader_svg/5_moka.svg',
    'preloader_svg/6_mask.svg',
    'preloader_svg/7_lamp.svg',
    'preloader_svg/8_card.svg',
    'preloader_svg/9_badword.svg',
];
const HOME_REVEAL_DELAY_AFTER_LOADER = 420;
const HOME_LOADER_FIRST_FRAME_DURATION = 200;
const HOME_LOADER_FRAME_DURATION = 222;
const HOME_LOADER_LAST_FRAME_HOLD = 360;
const HOME_SQUARE_REVEAL_DURATION = 3200;
const HOME_SQUARE_REVEAL_STAGGER_MS = 160;
const ABOUT_SCREEN_FADE_DURATION = 420;

function getHomeLoaderProgressElement(loader) {
    if (!(loader instanceof HTMLElement)) return null;

    let progress = loader.querySelector('.home-loader-progress');
    if (progress instanceof HTMLElement) return progress;

    progress = document.createElement('div');
    progress.className = 'home-loader-progress';
    progress.textContent = '0';
    loader.appendChild(progress);
    return progress;
}

function animateHomeLoaderProgress(loader, duration) {
    const progressElement = getHomeLoaderProgressElement(loader);
    if (!(progressElement instanceof HTMLElement)) {
        return () => {};
    }

    const safeDuration = Math.max(1, duration);
    const startTime = performance.now();
    let frameId = null;

    const render = (value) => {
        progressElement.textContent = String(Math.max(0, Math.min(100, value)));
    };

    render(0);

    function step(now) {
        if (!loader.isConnected) return;
        const elapsed = Math.min(safeDuration, now - startTime);
        const progress = elapsed / safeDuration;
        render(Math.round(progress * 100));

        if (elapsed < safeDuration) {
            frameId = requestAnimationFrame(step);
        }
    }

    frameId = requestAnimationFrame(step);

    return () => {
        if (frameId) cancelAnimationFrame(frameId);
        render(100);
    };
}

async function fetchTextWithFallback(paths) {
    for (const path of paths) {
        try {
            const response = await fetch(path);
            if (response.ok) return await response.text();
        } catch (_) {
            // Try next path.
        }
    }
    throw new Error('Frames not found');
}

function setVisibleFrame(frames, index) {
    frames.forEach((frame, i) => {
        frame.style.opacity = i === index ? '1' : '0';
        frame.style.visibility = i === index ? 'visible' : 'hidden';
    });
}

function wait(ms) {
    return new Promise(resolve => {
        window.setTimeout(resolve, ms);
    });
}

function waitForNextPaint() {
    return new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });
}

function startHomeIntroAfterLoader() {
    if (getCurrentNamespace() !== 'home') return;

    const container = getCurrentContainer();
    const homeGrid = container?.querySelector?.('.double-col-squares');
    if (!(homeGrid instanceof HTMLElement)) return;
    if (homeGrid.dataset.revealingFromWork === 'true') return;

    prepareHomeSquaresReveal(container);
    animateHomeSquaresReveal('home');
}

function ensureHomeLoader() {
    let loader = document.getElementById('home-loader');
    if (loader instanceof HTMLElement) return loader;

    loader = document.createElement('div');
    loader.id = 'home-loader';
    loader.setAttribute('aria-hidden', 'true');
    getHomeLoaderProgressElement(loader);
    document.body.appendChild(loader);
    return loader;
}

async function loadHomeLoaderFrames(loader) {
    if (!(loader instanceof HTMLElement)) return [];
    if (loader.dataset.framesLoaded === 'true') {
        return [...loader.querySelectorAll('.home-loader-frame')];
    }

    const markupList = await Promise.all(
        HOME_LOADER_FRAME_PATHS.map(path =>
            fetchTextWithFallback([`/${path}`, `./${path}`, path]).catch(() => '')
        )
    );

    loader.innerHTML = '';

    markupList.forEach((markup, index) => {
        if (!markup) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'home-loader-frame';
        wrapper.dataset.frameIndex = String(index);
        wrapper.innerHTML = markup.trim();
        loader.appendChild(wrapper);
    });

    loader.dataset.framesLoaded = 'true';
    return [...loader.querySelectorAll('.home-loader-frame')];
}

async function playHomeLoader() {
    if (hasPlayedHomeLoader) return;
    if (homeLoaderPromise) return homeLoaderPromise;

    homeLoaderPromise = (async () => {
        document.body.classList.add('home-loader-active');
        const loader = ensureHomeLoader();
        const frames = await loadHomeLoaderFrames(loader);
        const progressDuration = HOME_LOADER_FIRST_FRAME_DURATION
            + (Math.max(0, frames.length - 1) * HOME_LOADER_FRAME_DURATION)
            + HOME_LOADER_LAST_FRAME_HOLD;
        const finishLoaderProgress = animateHomeLoaderProgress(loader, progressDuration);

        if (!frames.length) {
            finishLoaderProgress();
            hasPlayedHomeLoader = true;
            loader.remove();
            await wait(HOME_REVEAL_DELAY_AFTER_LOADER);
            document.body.classList.remove('home-loader-active');
            startHomeIntroAfterLoader();
            return;
        }

        loader.dataset.active = 'true';
        delete loader.dataset.exit;
        setVisibleFrame(frames, 0);
        await waitForNextPaint();
        await wait(HOME_LOADER_FIRST_FRAME_DURATION);

        for (let index = 1; index < frames.length; index += 1) {
            await wait(HOME_LOADER_FRAME_DURATION);
            if (!loader.isConnected) return;
            setVisibleFrame(frames, index);
        }

        await wait(HOME_LOADER_LAST_FRAME_HOLD);
        finishLoaderProgress();
        loader.dataset.exit = 'true';
        delete loader.dataset.active;
        await wait(320);
        loader.remove();
        hasPlayedHomeLoader = true;
        await wait(HOME_REVEAL_DELAY_AFTER_LOADER);
        document.body.classList.remove('home-loader-active');

        startHomeIntroAfterLoader();
    })().finally(() => {
        homeLoaderPromise = null;
    });

    return homeLoaderPromise;
}

function revealHomeIntroElement(element) {
    if (!(element instanceof HTMLElement)) return;
    if (element.dataset.homeIntroRevealed === 'true') return;

    element.dataset.homeIntroRevealed = 'true';
    delete element.dataset.homeIntroRevealPending;
    element.style.transition = 'opacity 520ms ease, filter 700ms ease';
    element.style.visibility = '';
    element.style.opacity = '1';
    element.style.filter = 'blur(0)';
    window.setTimeout(() => {
        element.style.transition = '';
        element.style.filter = '';
    }, 740);
}

function scheduleHomeIntroLogoReveal(logoContainer, delay = 260) {
    if (!(logoContainer instanceof HTMLElement)) return;
    if (logoContainer.dataset.homeIntroRevealed === 'true') return;
    if (logoContainer.dataset.homeIntroRevealScheduled === 'true') return;

    logoContainer.dataset.homeIntroRevealScheduled = 'true';
    logoContainer.style.opacity = '0';
    logoContainer.style.visibility = 'hidden';
    logoContainer.style.filter = 'blur(12px)';

    if (logoContainer._homeIntroRevealTimeout) {
        clearTimeout(logoContainer._homeIntroRevealTimeout);
    }

    logoContainer._homeIntroRevealTimeout = window.setTimeout(() => {
        logoContainer._homeIntroRevealTimeout = null;
        delete logoContainer.dataset.homeIntroRevealScheduled;
        revealHomeIntroElement(logoContainer);
    }, delay);
}

function startLogoFrameLoop(logoContainer, startIndex = null) {
    const frames = [...logoContainer.querySelectorAll('.frame')];
    if (!frames.length) return;

    if (logoContainer._logoAnimationTimeout) {
        clearTimeout(logoContainer._logoAnimationTimeout);
        logoContainer._logoAnimationTimeout = null;
    }

    const frameDuration = 1000;
    let current = Number.isInteger(startIndex) ? startIndex : Math.floor(Math.random() * frames.length);
    current = ((current % frames.length) + frames.length) % frames.length;
    logoContainer.dataset.currentFrame = String(current);
    setVisibleFrame(frames, current);

    function step() {
        if (!logoContainer.isConnected) return;
        current = (current + 1) % frames.length;
        logoContainer.dataset.currentFrame = String(current);
        setVisibleFrame(frames, current);
        logoContainer._logoAnimationTimeout = setTimeout(step, frameDuration);
    }

    logoContainer._logoAnimationTimeout = setTimeout(step, frameDuration);
}

function getCurrentLogoFrameIndex(logoContainer) {
    const current = Number.parseInt(logoContainer?.dataset.currentFrame || '', 10);
    return Number.isNaN(current) ? 0 : current;
}

function logoAnimation() {
    const logoContainer = document.getElementById('logo-container');
    if (!logoContainer || logoContainer.dataset.framesLoaded === 'true') return;

    logoContainer.dataset.framesLoaded = 'true';

    fetchTextWithFallback(['/svgFrames.html', './svgFrames.html', './public/svgFrames.html'])
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${data}</div>`, 'text/html');
            const svgs = [...doc.querySelectorAll('svg')];
            if (!svgs.length) return;

            svgs.forEach(svg => {
                svg.style.opacity = '0';
                svg.style.visibility = 'hidden';
                logoContainer.appendChild(svg);
            });

            startLogoFrameLoop(logoContainer);
            logoContainer.dataset.logoReady = 'true';
            if (logoContainer.dataset.homeIntroRevealPending === 'true') {
                scheduleHomeIntroLogoReveal(logoContainer);
            }
        })
        .catch(() => {
            // Silent fallback.
        });
}

function heartAnimation() {
    const heartContainer = document.getElementById('heart-container');
    if (!heartContainer || heartContainer.dataset.framesLoaded === 'true') return;

    heartContainer.dataset.framesLoaded = 'true';

    fetchTextWithFallback(['/heartSvgFrames.html', './heartSvgFrames.html', './public/heartSvgFrames.html'])
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${data}</div>`, 'text/html');
            const svgs = [...doc.querySelectorAll('svg')];
            if (!svgs.length) return;

            svgs.forEach((svg, index) => {
                svg.classList.add('heartFrame');
                svg.id = `frame-${index + 1}`;
                svg.style.width = `${[90, 110, 130][index] || 110}px`;
                svg.style.height = 'auto';
                svg.style.opacity = '0';
                svg.style.visibility = 'hidden';
                heartContainer.appendChild(svg);
            });

            const frames = [...heartContainer.querySelectorAll('.heartFrame')];
            if (!frames.length) return;

            const frameDurations = [220, 420, 320];
            let current = 0;
            let timeoutId = null;
            let isPlaying = false;
            setVisibleFrame(frames, current);

            function step() {
                if (!heartContainer.isConnected || !isPlaying) return;
                current = (current + 1) % frames.length;
                setVisibleFrame(frames, current);

                const duration = frameDurations[current] || frameDurations[frameDurations.length - 1] || 900;
                timeoutId = setTimeout(step, duration);
            }

            heartContainer.startAnimation = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                current = 0;
                isPlaying = true;
                setVisibleFrame(frames, current);
                timeoutId = setTimeout(step, frameDurations[current] || 900);
            };

            heartContainer.stopAnimation = () => {
                isPlaying = false;
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
            };

            heartContainer.startAnimation();
        })
        .catch(() => {
            // Silent fallback.
        });
}

function bindFreakHover() {
    const container = getCurrentContainer();
    const freak = container?.querySelector('.FREAK');
    const copyright = document.getElementById('site-copyright');
    const home = container?.querySelector('#crxtian-hub_home');
    const planetLogo = document.getElementById('logo-container');
    const heart = container?.querySelector('#heart-container');
    const lines = container?.querySelectorAll('.lineCancelling') || [];
    const coloredElements = container?.querySelectorAll('.colored') || [];

    if (!freak || !home || !heart || !copyright || freak.dataset.bound === 'true') return;

    document.body.classList.remove('about-hovered');
    home.classList.remove('hovered');
    freak.classList.remove('hovered');
    planetLogo?.classList.remove('hovered');
    heart.classList.remove('hovered');
    copyright.classList.remove('hovered');
    lines.forEach(line => line.classList.remove('hovered'));
    coloredElements.forEach(el => el.classList.remove('hovered'));

    freak.dataset.bound = 'true';

    freak.addEventListener('mouseenter', () => {
        document.body.classList.add('about-hovered');
        home.classList.add('hovered');
        freak.classList.add('hovered');
        planetLogo?.classList.add('hovered');
        heart.classList.add('hovered');
        copyright.classList.add('hovered');
        lines.forEach(line => line.classList.add('hovered'));
        coloredElements.forEach(el => el.classList.add('hovered'));
    });

    freak.addEventListener('mouseleave', () => {
        document.body.classList.remove('about-hovered');
        home.classList.remove('hovered');
        freak.classList.remove('hovered');
        planetLogo?.classList.remove('hovered');
        heart.classList.remove('hovered');
        copyright.classList.remove('hovered');
        lines.forEach(line => line.classList.remove('hovered'));
        coloredElements.forEach(el => el.classList.remove('hovered'));
    });
}

function resetInlineTransforms() {
    const selectors = ['#logo-container', '.menuVoices', '#aboutSection', '.aboutMe', '.designedBy'];
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.style.transform = '';
            el.style.opacity = '';
            el.style.visibility = '';
            el.style.transition = '';
            el.style.left = '';
            el.style.top = '';
            el.style.width = '';
            el.style.height = '';
            el.style.willChange = '';
        });
    });
}

function ensurePersistentCopyright() {
    let persistentCopyright = document.getElementById('site-copyright');
    if (!(persistentCopyright instanceof HTMLElement)) {
        persistentCopyright = document.createElement('div');
        persistentCopyright.id = 'site-copyright';
        persistentCopyright.className = 'copyright';
        const text = document.createElement('div');
        persistentCopyright.appendChild(text);
        document.body.appendChild(persistentCopyright);
    }

    const sourceText = getCurrentContainer()?.querySelector('.copyright div')?.textContent?.trim();
    const targetText = persistentCopyright.querySelector('div');
    if (targetText instanceof HTMLElement) {
        targetText.textContent = sourceText || "cristian d’agostino 2025©";
    }

    return persistentCopyright;
}

function bindGridToggle() {
    const displaygrid = document.querySelector('.displaygrid');
    const grid = document.querySelector('.grid-12');

    if (!displaygrid || !grid || displaygrid.dataset.bound === 'true') return;

    displaygrid.dataset.bound = 'true';
    displaygrid.addEventListener('click', () => {
        const isHidden = getComputedStyle(grid).display === 'none';
        const shouldShow = isHidden;
        grid.style.display = shouldShow ? 'grid' : 'none';
        displaygrid.setAttribute('aria-pressed', shouldShow ? 'true' : 'false');
    });
}

function bindHomeSquareSelection(namespace) {
    if (namespace !== 'home') return;

    const container = getCurrentContainer();
    const links = container?.querySelectorAll('.double-col-square-link') || [];
    const squares = container?.querySelectorAll('.double-col-square') || [];

    squares.forEach((square) => {
        square.classList.remove('double-col-square-selected');
    });

    links.forEach((link) => {
        if (link.dataset.selectionBound === 'true') return;
        link.dataset.selectionBound = 'true';

        const activateSquare = () => {
            squares.forEach((square) => {
                const isSelected = square.contains(link);
                square.classList.toggle('double-col-square-selected', isSelected);
                const media = square.querySelector('.double-col-square-media');
                if (media instanceof HTMLElement) {
                    media.style.filter = isSelected ? 'blur(0) grayscale(0)' : '';
                }
            });
        };

        link.addEventListener('pointerdown', activateSquare);
        link.addEventListener('click', activateSquare);
    });
}

function startHomeProjectExit(trigger) {
    const square = getHomeWorkSquare(trigger);
    const container = getCurrentContainer();
    const grid = container?.querySelector('.double-col-squares');
    const squares = [...(container?.querySelectorAll('.double-col-square') || [])];

    squares.forEach((item, index) => {
        const isSelected = item === square;
        item.classList.toggle('double-col-square-selected', isSelected);
        item.classList.toggle('double-col-square-leaving', !isSelected);
        item.style.transitionDelay = '0ms';
    });

    grid?.setAttribute('data-project-leaving', 'true');

    return {
        grid,
        clear() {
            grid?.removeAttribute('data-project-leaving');
            squares.forEach((item) => {
                item.classList.remove('double-col-square-leaving');
                item.style.transitionDelay = '';
            });
        }
    };
}

function setStaticSections(namespace) {
    const aboutSection = document.querySelector('#aboutSection');
    const workSection = document.querySelector('#workSection');

    if (namespace === 'about') {
        aboutSection?.classList.add('toShow');
        aboutSection?.classList.remove('toHide');
        workSection?.classList.add('toHide');
        workSection?.classList.remove('toShow');
    }
}

function setLastSitePage(path) {
    if (!path || /about\.html(?:$|[?#])/.test(path)) return;
    sessionStorage.setItem('lastSitePage', path);
}

function getPathForNamespace(namespace) {
    if (namespace === 'home') return './index.html';
    if (namespace === 'about') return './about.html';
    return workPageByNamespace[namespace] ? `./${workPageByNamespace[namespace]}` : '';
}

function storeLastSitePage(namespace) {
    if (namespace === 'about') return;
    setLastSitePage(getPathForNamespace(namespace));
}

function bindAboutEntryLinks(namespace) {
    if (namespace === 'about') return;

    const container = getCurrentContainer();
    const aboutLinks = container?.querySelectorAll('.aboutVoice[href]') || [];
    aboutLinks.forEach((link) => {
        if (!(link instanceof HTMLAnchorElement) || link.dataset.aboutEntryBound === 'true') return;

        link.dataset.aboutEntryBound = 'true';
        link.addEventListener('click', () => {
            setLastSitePage(getPathForNamespace(namespace));
        });
    });
}

function getLastSitePagePath() {
    const fallbackPath = './index.html';
    const lastSitePage = sessionStorage.getItem('lastSitePage');

    if (!lastSitePage || /about\.html(?:$|[?#])/.test(lastSitePage)) {
        return fallbackPath;
    }

    return lastSitePage;
}

function bindAboutCloseLink(namespace) {
    if (namespace !== 'about') return;

    const container = getCurrentContainer();
    const closeLink = container?.querySelector('.menu .menuVoices');
    if (!closeLink || closeLink.dataset.bound === 'true') return;

    closeLink.setAttribute('href', getLastSitePagePath());
    closeLink.dataset.bound = 'true';

    closeLink.addEventListener('click', (event) => {
        const lastSitePage = getLastSitePagePath();
        closeLink.setAttribute('href', lastSitePage);

        event.preventDefault();
        barba.go(lastSitePage, closeLink, event);
    });
}

function bindWorkPageLogoHome() {
    const isWorkPage = document.body.classList.contains('work-page');
    const logoContainer = document.getElementById('logo-container');

    if (!isWorkPage || !logoContainer || logoContainer.dataset.homeBound === 'true') return;

    logoContainer.dataset.homeBound = 'true';
    logoContainer.addEventListener('click', async (event) => {
        if (document.body.dataset.workPageNavPending === 'true') return;

        document.body.dataset.workPageNavPending = 'true';
        await ensureWorkPageAtTopBeforeNavigate();
        barba.go('./index.html', logoContainer, event);
    });
}

function getWorkPageScroller(container = getCurrentContainer()) {
    const sectionScroller = container?.querySelector?.('#crxtian-hub_home');
    if (sectionScroller instanceof HTMLElement && sectionScroller.scrollHeight > (sectionScroller.clientHeight + 1)) {
        return sectionScroller;
    }

    return document.scrollingElement instanceof HTMLElement
        ? document.scrollingElement
        : document.documentElement;
}

function getScrollerTop(scroller) {
    if (scroller === document.documentElement || scroller === document.body) {
        return window.scrollY || window.pageYOffset || scroller.scrollTop || 0;
    }

    return scroller instanceof HTMLElement ? scroller.scrollTop : 0;
}

function setScrollerTop(scroller, top, behavior = 'auto') {
    if (scroller === document.documentElement || scroller === document.body) {
        window.scrollTo({ top, behavior });
        return;
    }

    if (scroller instanceof HTMLElement) {
        scroller.scrollTo({ top, behavior });
    }
}

function scrollWorkPageToTop(container = getCurrentContainer()) {
    const scroller = getWorkPageScroller(container);
    if (!(scroller instanceof HTMLElement)) return Promise.resolve();

    const startTop = getScrollerTop(scroller);
    if (startTop <= 2) return Promise.resolve();

    const duration = Math.min(360, Math.max(180, startTop * 0.1));
    const startTime = performance.now();
    const originalScrollBehavior = scroller.style.scrollBehavior;
    scroller.style.scrollBehavior = 'auto';

    return new Promise(resolve => {
        const finish = () => {
            setScrollerTop(scroller, 0);
            scroller.style.scrollBehavior = originalScrollBehavior;
            resolve();
        };

        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const eased = easeInOutCubic(progress);
            const nextTop = startTop * (1 - eased);

            setScrollerTop(scroller, nextTop);

            if (progress >= 1) {
                finish();
                return;
            }

            requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
    });
}

function waitForScrollTopSettle(container = getCurrentContainer(), frames = 2) {
    const scroller = getWorkPageScroller(container);
    if (!(scroller instanceof HTMLElement)) return Promise.resolve();

    setScrollerTop(scroller, 0);

    return new Promise(resolve => {
        let remainingFrames = Math.max(1, frames);

        const step = () => {
            setScrollerTop(scroller, 0);
            remainingFrames -= 1;

            if (remainingFrames <= 0) {
                resolve();
                return;
            }

            requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
    });
}

async function ensureWorkPageAtTopBeforeNavigate(container = getCurrentContainer()) {
    await scrollWorkPageToTop(container);
    await waitForScrollTopSettle(container);
}

function shouldHandleWorkPageNavigationClick(event) {
    return event.button === 0
        && !event.metaKey
        && !event.ctrlKey
        && !event.shiftKey
        && !event.altKey;
}

function getWorkProjectDirectionFromLink(link) {
    if (!(link instanceof Element)) return null;
    if (link.closest('.work-page-project-link-next')) return 'next';
    if (link.closest('.work-page-project-link-prev')) return 'previous';
    return null;
}

function bindWorkPageProjectLinks() {
    const container = getCurrentContainer();
    const links = [...(container?.querySelectorAll('.work-page-project-link[href]') || [])];

    links.forEach((link) => {
        if (!(link instanceof HTMLAnchorElement) || link.dataset.topScrollBound === 'true') return;

        link.dataset.topScrollBound = 'true';
        link.addEventListener('click', async (event) => {
            if (!shouldHandleWorkPageNavigationClick(event)) return;
            if (document.body.dataset.workPageNavPending === 'true') {
                event.preventDefault();
                return;
            }

            event.preventDefault();
            document.body.dataset.workPageNavPending = 'true';
            pendingWorkProjectDirection = getWorkProjectDirectionFromLink(link);
            barba.go(link.getAttribute('href') || link.href, link, event);
        });
    });
}

function resetWorkPageNavigationState() {
    delete document.body.dataset.workPageNavPending;
    pendingWorkProjectDirection = null;
}

function syncPersistentWorkIndex(container = getCurrentContainer()) {
    const persistentIndex = getPersistentWorkIndexElement();
    const targetIndex = container?.querySelector('.work-page-index');
    const isWorkPage = document.body.classList.contains('work-page');
    const text = persistentIndex.querySelector('text');

    if (!isWorkPage || !(targetIndex instanceof HTMLElement) || !(text instanceof SVGTextElement)) {
        hidePersistentWorkIndex();
        return;
    }

    const rect = targetIndex.getBoundingClientRect();
    const computed = getComputedStyle(targetIndex);

    text.textContent = targetIndex.textContent || '';
    persistentIndex.style.display = 'block';
    persistentIndex.style.opacity = '1';
    persistentIndex.style.visibility = 'visible';
    persistentIndex.style.willChange = '';
    applyPersistentIndexBox(persistentIndex, rect, {
        color: computed.color,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontFamily: computed.fontFamily,
        letterSpacing: computed.letterSpacing,
        lineHeight: computed.lineHeight,
        textTransform: computed.textTransform
    });

    if (workToWorkIndexRevealPending) {
        workToWorkIndexRevealPending = false;
        persistentIndex.style.transition = 'none';
        persistentIndex.style.opacity = '0';
        persistentIndex.style.filter = 'blur(10px)';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                persistentIndex.style.transition = 'opacity .4s ease, filter .45s ease';
                persistentIndex.style.opacity = '1';
                persistentIndex.style.filter = 'blur(0)';

                window.setTimeout(() => {
                    persistentIndex.style.transition = '';
                    persistentIndex.style.filter = '';
                }, 450);
            });
        });
        return;
    }

    persistentIndex.style.opacity = '1';
    persistentIndex.style.filter = 'blur(0)';
}

function renderWorkPageTitles(container = getCurrentContainer()) {
    const titles = container?.querySelectorAll('.work-page-title[data-line-1], .work-page-title[data-line1]') || [];

    titles.forEach(title => {
        if (title.dataset.rendered === 'true') return;

        const line1 = title.getAttribute('data-line-1') || title.getAttribute('data-line1') || '';
        const line2 = title.getAttribute('data-line-2') || title.getAttribute('data-line2') || '';
        const firstRowChars = Array.from(line1);
        const secondRowChars = Array.from(line2);

        title.textContent = '';

        const row1 = document.createElement('div');
        row1.className = 'work-title-row';

        firstRowChars.forEach(char => {
            const cell = document.createElement('span');
            const isSpace = char === ' ';
            cell.className = isSpace ? 'work-title-space' : 'work-title-letter';
            if (!isSpace) cell.textContent = char;
            row1.appendChild(cell);
        });

        const row2 = document.createElement('div');
        row2.className = 'work-title-row';

        secondRowChars.forEach((char, index) => {
            const cell = document.createElement('span');
            const isSpace = char === ' ';
            cell.className = isSpace ? 'work-title-space' : 'work-title-letter';

            const charAbove = firstRowChars[index];
            const hasLetterAbove = typeof charAbove !== 'undefined' && charAbove !== ' ';
            if (!isSpace && hasLetterAbove) {
                cell.classList.add('work-title-hide-top');
            }

            if (!isSpace) cell.textContent = char;
            row2.appendChild(cell);
        });

        title.appendChild(row1);
        title.appendChild(row2);
        title.dataset.rendered = 'true';
    });
}

function clearWorkPageTitleAnimation(title) {
    if (title?._titleRevealTimeouts) {
        title._titleRevealTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        title._titleRevealTimeouts = null;
    }

    if (title?._titleExitTimeouts) {
        title._titleExitTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        title._titleExitTimeouts = null;
    }
}

function clearWorkPageMetaAnimation(group) {
    if (group?._subtitleRevealTimeout) {
        clearTimeout(group._subtitleRevealTimeout);
        group._subtitleRevealTimeout = null;
    }
}

function clearWorkPageUtilityAnimation(element) {
    if (element?._workUtilityRevealTimeout) {
        clearTimeout(element._workUtilityRevealTimeout);
        element._workUtilityRevealTimeout = null;
    }
}

function prepareWorkPageEntranceState(container = getCurrentContainer()) {
    const titles = container?.querySelectorAll('.work-page-title') || [];
    const subtitleGroups = container?.querySelectorAll('.work-page-meta') || [];
    const projectLinks = [...(container?.querySelectorAll('.work-page-project-link') || [])];
    const thumbSlider = container?.querySelector('.work-thumb-slider');
    const thumbImages = [...(container?.querySelectorAll('.work-page-thumbs-list img') || [])];
    const galleryImages = [...(container?.querySelectorAll('.work-page-gallery .work-page-image') || [])].slice(1);

    titles.forEach((title) => {
        const letters = [...title.querySelectorAll('.work-title-letter')];
        clearWorkPageTitleAnimation(title);
        letters.forEach((letter) => {
            letter.style.opacity = '0';
        });
    });

    subtitleGroups.forEach((group) => {
        clearWorkPageMetaAnimation(group);
        group.classList.remove('work-page-meta-visible');
    });

    [...projectLinks, thumbSlider].filter(Boolean).forEach((element) => {
        clearWorkPageUtilityAnimation(element);
        if (element.classList.contains('work-thumb-slider')) {
            element.classList.remove('work-thumb-slider-visible');
        } else {
            element.classList.remove('work-page-project-link-visible');
        }
    });

    thumbImages.forEach((thumb) => {
        clearWorkPageUtilityAnimation(thumb);
        thumb.classList.remove('work-page-thumb-exit');
        thumb.classList.remove('work-page-thumb-visible');
    });

    galleryImages.forEach((image) => {
        if (image._galleryRevealTimeout) {
            clearTimeout(image._galleryRevealTimeout);
            image._galleryRevealTimeout = null;
        }

        image.classList.remove('work-page-image-exit');
        image.classList.remove('work-page-image-visible');
    });
}

function animateWorkPageUtilities(startDelay = 0, container = getCurrentContainer()) {
    const projectLinks = [...(container?.querySelectorAll('.work-page-project-link') || [])];
    const thumbSlider = container?.querySelector('.work-thumb-slider');
    const thumbImages = [...(container?.querySelectorAll('.work-page-thumbs-list img') || [])];
    const utilityTargets = [...projectLinks, thumbSlider].filter(Boolean);
    const revealDelay = startDelay + 360;

    utilityTargets.forEach((element) => {
        const visibleClass = element.classList.contains('work-thumb-slider')
            ? 'work-thumb-slider-visible'
            : 'work-page-project-link-visible';

        clearWorkPageUtilityAnimation(element);
        element.classList.remove(visibleClass);
        element._workUtilityRevealTimeout = setTimeout(() => {
            element.classList.add(visibleClass);
        }, revealDelay);
    });

    thumbImages.forEach((thumb, index) => {
        clearWorkPageUtilityAnimation(thumb);
        thumb.classList.remove('work-page-thumb-exit');
        thumb.classList.remove('work-page-thumb-visible');
        thumb._workUtilityRevealTimeout = setTimeout(() => {
            thumb.classList.add('work-page-thumb-visible');
        }, revealDelay + (index * 70));
    });

    return revealDelay;
}

function animateWorkPageTitles(container = getCurrentContainer(), { forceRestart = false } = {}) {
    if (container && !forceRestart) {
        const sequenceEndTime = Number(container.dataset.workTitleRevealEndsAt || 0);
        if (container.dataset.workTitleRevealStarted === 'true') {
            return sequenceEndTime > performance.now()
                ? Math.max(0, Math.ceil(sequenceEndTime - performance.now()))
                : 0;
        }
    }

    const titles = container?.querySelectorAll('.work-page-title') || [];
    const subtitleGroups = container?.querySelectorAll('.work-page-meta') || [];
    let longestDelay = 0;

    titles.forEach(title => {
        const letters = [...title.querySelectorAll('.work-title-letter')];
        if (!letters.length) return;

        clearWorkPageTitleAnimation(title);

        letters.forEach(letter => {
            letter.style.opacity = '0';
        });

        const randomizedLetters = [...letters];
        for (let i = randomizedLetters.length - 1; i > 0; i -= 1) {
            const swapIndex = Math.floor(Math.random() * (i + 1));
            [randomizedLetters[i], randomizedLetters[swapIndex]] = [randomizedLetters[swapIndex], randomizedLetters[i]];
        }

        title._titleRevealOrder = randomizedLetters;
        title._titleRevealTimeouts = randomizedLetters.map((letter, index) => {
            const delay = 0 + (index * 70) + Math.round(Math.random() * 70);
            longestDelay = Math.max(longestDelay, delay);

            return setTimeout(() => {
                letter.style.opacity = '1';
            }, delay);
        });
    });

    subtitleGroups.forEach(group => {
        group.classList.remove('work-page-meta-visible');
        clearWorkPageMetaAnimation(group);

        group._subtitleRevealTimeout = setTimeout(() => {
            group.classList.add('work-page-meta-visible');
        }, longestDelay + 360);
    });

    const sequenceDuration = longestDelay + 360;

    if (container) {
        container.dataset.workTitleRevealStarted = 'true';
        container.dataset.workTitleRevealEndsAt = `${performance.now() + sequenceDuration}`;
    }

    return sequenceDuration;
}

function animateWorkPageTitlesOut(container = getCurrentContainer()) {
    const titles = container?.querySelectorAll('.work-page-title') || [];
    const subtitleGroups = container?.querySelectorAll('.work-page-meta') || [];
    const projectLinks = [...(container?.querySelectorAll('.work-page-project-link') || [])];
    const thumbSlider = container?.querySelector('.work-thumb-slider');
    const thumbImages = [...(container?.querySelectorAll('.work-page-thumbs-list img') || [])];
    const galleryImages = [...(container?.querySelectorAll('.work-page-gallery .work-page-image') || [])].slice(1);
    let longestDelay = 0;
    const thumbExitDuration = 1050;
    const galleryExitDuration = 980;

    subtitleGroups.forEach(group => {
        clearWorkPageMetaAnimation(group);
        group.classList.remove('work-page-meta-visible');
    });

    [...projectLinks, thumbSlider].filter(Boolean).forEach((element) => {
        clearWorkPageUtilityAnimation(element);
        if (element.classList.contains('work-thumb-slider')) {
            element.classList.remove('work-thumb-slider-visible');
        } else {
            element.classList.remove('work-page-project-link-visible');
        }
    });

    thumbImages.forEach((thumb, index) => {
        clearWorkPageUtilityAnimation(thumb);
        const delay = index * 70;
        longestDelay = Math.max(longestDelay, delay + thumbExitDuration);
        thumb._workUtilityRevealTimeout = setTimeout(() => {
            thumb.classList.remove('work-page-thumb-visible');
            thumb.classList.add('work-page-thumb-exit');
        }, delay);
    });

    galleryImages.forEach((image, index) => {
        if (image._galleryRevealTimeout) {
            clearTimeout(image._galleryRevealTimeout);
            image._galleryRevealTimeout = null;
        }

        image.classList.remove('work-page-image-exit');
        image.classList.add('work-page-image-visible');

        const delay = index * 110;
        longestDelay = Math.max(longestDelay, delay + galleryExitDuration);
        image._galleryRevealTimeout = setTimeout(() => {
            image.classList.add('work-page-image-exit');
        }, delay);
    });

    titles.forEach(title => {
        const letters = [...title.querySelectorAll('.work-title-letter')];
        if (!letters.length) return;

        clearWorkPageTitleAnimation(title);
        letters.forEach(letter => {
            letter.style.opacity = '1';
        });

        const revealOrder = Array.isArray(title._titleRevealOrder) && title._titleRevealOrder.length
            ? title._titleRevealOrder
            : letters;
        const reversedLetters = [...revealOrder].reverse();

        title._titleExitTimeouts = reversedLetters.map((letter, index) => {
            const delay = index * 60;
            longestDelay = Math.max(longestDelay, delay);

            return setTimeout(() => {
                letter.style.opacity = '0';
            }, delay);
        });
    });

    const totalDuration = Math.max(longestDelay + 360, 360);
    return new Promise(resolve => {
        setTimeout(resolve, totalDuration);
    });
}

function animateWorkPageFrameOut(container = getCurrentContainer()) {
    const frameElements = [
        container?.querySelector('.displaygrid'),
        container?.querySelector('footer'),
        container?.querySelector('.menu')
    ].filter(Boolean);

    if (!frameElements.length) return Promise.resolve();

    const duration = 700;

    frameElements.forEach((element) => {
        if (!(element instanceof HTMLElement)) return;
        element.style.transition = `opacity ${duration}ms ease, filter ${duration}ms ease`;
        element.style.opacity = '0';
        element.style.filter = 'blur(10px)';
    });

    return new Promise(resolve => {
        window.setTimeout(resolve, duration);
    });
}

function animateWorkPageGalleryImages(startDelay = 0, container = getCurrentContainer()) {
    const images = [...(container?.querySelectorAll('.work-page-gallery .work-page-image') || [])].slice(1);

    images.forEach((image, index) => {
        image.classList.remove('work-page-image-exit');
        image.classList.remove('work-page-image-visible');

        if (image._galleryRevealTimeout) {
            clearTimeout(image._galleryRevealTimeout);
        }

        image._galleryRevealTimeout = setTimeout(() => {
            image.classList.add('work-page-image-visible');
        }, startDelay + 220 + (index * 130));
    });
}

let cleanupWorkPageThumbSlider = null;

function bindWorkPageThumbSlider() {
    if (cleanupWorkPageThumbSlider) {
        cleanupWorkPageThumbSlider();
        cleanupWorkPageThumbSlider = null;
    }

    const container = getCurrentContainer();
    const scrollContainer = container?.querySelector('#crxtian-hub_home');
    const images = [...(container?.querySelectorAll('.work-page-gallery .work-page-image') || [])];
    const thumbsList = container?.querySelector('.work-page-thumbs-list');
    const thumbs = thumbsList ? [...thumbsList.querySelectorAll('img')] : [];
    const slider = thumbsList ? thumbsList.querySelector('.work-thumb-slider') : null;

    if (!scrollContainer || !thumbsList || !slider || !images.length || thumbs.length !== images.length) return;
    if (thumbsList.dataset.bound === 'true') return;
    thumbsList.dataset.bound = 'true';
    const sliderScaleX = 1.08;
    const sliderScaleY = 2;
    const ease = 0.22;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = null;
    let trackingRafId = null;
    let refreshRafId = null;
    let refreshTimeoutId = null;
    let isProgrammaticScroll = false;
    let programmaticScrollIndex = -1;
    let programmaticScrollTimeout = null;
    let currentProgress = 0;
    const mediaElements = [
        ...images.map((image) => getWorkPageMediaElement(image)).filter(Boolean),
        ...thumbs
    ];
    const cleanupMediaListeners = [];

    const animateSlider = () => {
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;

        const dx = Math.abs(targetX - currentX);
        const dy = Math.abs(targetY - currentY);

        if (dx < 0.12 && dy < 0.12) {
            currentX = targetX;
            currentY = targetY;
        }

        slider.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

        if (currentX !== targetX || currentY !== targetY) {
            rafId = requestAnimationFrame(animateSlider);
        } else {
            rafId = null;
        }
    };

    const getThumbBox = (index) => {
        const thumb = thumbs[index];
        if (!thumb) return null;
        const sliderWidth = thumb.offsetWidth * sliderScaleX;
        const sliderHeight = thumb.offsetHeight * sliderScaleY;
        const sliderLeft = thumb.offsetLeft - ((sliderWidth - thumb.offsetWidth) / 2);
        const sliderTop = thumb.offsetTop - ((sliderHeight - thumb.offsetHeight) / 2);
        return { x: sliderLeft, y: sliderTop, w: sliderWidth, h: sliderHeight };
    };

    const applySliderTarget = (x, y, w, h, immediate = false) => {
        slider.style.width = `${w}px`;
        slider.style.height = `${h}px`;
        slider.style.left = '0px';
        slider.style.top = '0px';

        targetX = x;
        targetY = y;

        if (immediate) {
            currentX = targetX;
            currentY = targetY;
            slider.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            return;
        }

        if (!rafId) {
            rafId = requestAnimationFrame(animateSlider);
        }
    };

    const moveSliderToIndex = (index, immediate = false) => {
        const box = getThumbBox(index);
        if (!box) return;
        applySliderTarget(box.x, box.y, box.w, box.h, immediate);
    };

    const clearProgrammaticScroll = () => {
        isProgrammaticScroll = false;
        programmaticScrollIndex = -1;
        if (programmaticScrollTimeout) {
            clearTimeout(programmaticScrollTimeout);
            programmaticScrollTimeout = null;
        }
    };

    const scheduleProgrammaticScrollFallback = () => {
        if (programmaticScrollTimeout) clearTimeout(programmaticScrollTimeout);
        programmaticScrollTimeout = setTimeout(() => {
            clearProgrammaticScroll();
            syncSliderToScroll();
        }, 700);
    };

    const getTrackingLineY = () => {
        const thumbsListRect = thumbsList.getBoundingClientRect();
        const firstThumb = thumbs[0];
        const thumbHeight = firstThumb ? firstThumb.getBoundingClientRect().height : 0;
        const innerScroll = scrollContainer.scrollHeight > (scrollContainer.clientHeight + 1);

        if (innerScroll) {
            const containerRect = scrollContainer.getBoundingClientRect();
            return scrollContainer.scrollTop + (thumbsListRect.top - containerRect.top) + (thumbHeight / 2);
        }

        return (window.scrollY || window.pageYOffset || 0) + thumbsListRect.top + (thumbHeight / 2);
    };

    thumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            isProgrammaticScroll = true;
            programmaticScrollIndex = index;
            moveSliderToIndex(index);
            scheduleProgrammaticScrollFallback();
            images[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    const getScrollProgressIndex = () => {
        const trackingLineY = getTrackingLineY();
        const innerScroll = scrollContainer.scrollHeight > (scrollContainer.clientHeight + 1);
        const maxScroll = innerScroll
            ? Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight)
            : Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const currentScroll = innerScroll
            ? scrollContainer.scrollTop
            : (window.scrollY || window.pageYOffset || 0);

        if (currentScroll <= 1) return 0;

        const centers = images.map((image) => {
            if (innerScroll) {
                return image.offsetTop + (image.offsetHeight / 2);
            }

            const imageRect = image.getBoundingClientRect();
            return (window.scrollY || window.pageYOffset || 0) + imageRect.top + (imageRect.height / 2);
        });

        if (!centers.length) return 0;
        if (trackingLineY <= centers[0]) return 0;

        const lastIndex = centers.length - 1;
        if (maxScroll > 0 && currentScroll >= maxScroll - 2) return lastIndex;
        if (trackingLineY >= centers[lastIndex]) return lastIndex;

        for (let index = 0; index < lastIndex; index += 1) {
            const start = centers[index];
            const end = centers[index + 1];

            if (trackingLineY >= start && trackingLineY <= end) {
                const distance = end - start;
                if (Math.abs(distance) < 0.001) return index;
                const ratio = (trackingLineY - start) / distance;
                return index + ratio;
            }
        }

        return lastIndex;
    };

    const syncSliderToScroll = () => {
        const progress = getScrollProgressIndex();
        currentProgress = progress;
        const clampedProgress = Math.max(0, Math.min(thumbs.length - 1, progress));
        const startIndex = Math.floor(clampedProgress);
        const endIndex = Math.min(thumbs.length - 1, startIndex + 1);
        const mix = clampedProgress - startIndex;
        const startBox = getThumbBox(startIndex);
        const endBox = getThumbBox(endIndex);

        if (!startBox || !endBox) return;

        const x = startBox.x + ((endBox.x - startBox.x) * mix);
        const y = startBox.y + ((endBox.y - startBox.y) * mix);
        const w = startBox.w + ((endBox.w - startBox.w) * mix);
        const h = startBox.h + ((endBox.h - startBox.h) * mix);

        applySliderTarget(x, y, w, h);
    };

    const updateSliderFromViewport = () => {
        if (isProgrammaticScroll) {
            const progress = getScrollProgressIndex();
            if (Math.abs(progress - programmaticScrollIndex) < 0.05) {
                clearProgrammaticScroll();
            }
        }

        if (!isProgrammaticScroll) {
            syncSliderToScroll();
        }
    };

    const onScroll = () => {
        if (isProgrammaticScroll) {
            scheduleProgrammaticScrollFallback();
        }
        updateSliderFromViewport();
    };

    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    const onResize = () => {
        const progress = getScrollProgressIndex();
        currentProgress = progress;
        const nearest = Math.round(progress);
        moveSliderToIndex(nearest, true);
        syncSliderToScroll();
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('load', onResize, { once: true });

    const scheduleRefresh = (delay = 0) => {
        if (refreshTimeoutId) {
            clearTimeout(refreshTimeoutId);
            refreshTimeoutId = null;
        }

        const run = () => {
            if (refreshRafId) {
                cancelAnimationFrame(refreshRafId);
            }

            refreshRafId = requestAnimationFrame(() => {
                refreshRafId = requestAnimationFrame(() => {
                    onResize();
                    refreshRafId = null;
                });
            });
        };

        if (delay > 0) {
            refreshTimeoutId = setTimeout(() => {
                refreshTimeoutId = null;
                run();
            }, delay);
            return;
        }

        run();
    };

    const onImageTransitionEnd = (event) => {
        if (event.propertyName !== 'transform') return;
        const nearest = Math.round(currentProgress || getScrollProgressIndex());
        moveSliderToIndex(nearest, true);
        syncSliderToScroll();
    };

    const trackSlider = () => {
        updateSliderFromViewport();
        trackingRafId = requestAnimationFrame(trackSlider);
    };

    images.forEach(image => {
        image.addEventListener('transitionend', onImageTransitionEnd);
    });

    mediaElements.forEach((media) => {
        if (isMediaLoaded(media)) return;
        cleanupMediaListeners.push(addMediaReadyListener(media, onResize));
    });

    syncSliderToScroll();
    scheduleRefresh();
    scheduleRefresh(120);
    scheduleRefresh(320);
    trackingRafId = requestAnimationFrame(trackSlider);

    cleanupWorkPageThumbSlider = () => {
        thumbsList.dataset.bound = 'false';
        scrollContainer.removeEventListener('scroll', onScroll);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('load', onResize);
        if (trackingRafId) {
            cancelAnimationFrame(trackingRafId);
            trackingRafId = null;
        }
        images.forEach(image => {
            image.removeEventListener('transitionend', onImageTransitionEnd);
        });
        cleanupMediaListeners.forEach((cleanup) => cleanup());
        if (refreshRafId) {
            cancelAnimationFrame(refreshRafId);
            refreshRafId = null;
        }
        if (refreshTimeoutId) {
            clearTimeout(refreshTimeoutId);
            refreshTimeoutId = null;
        }
    };
}

function getCurrentNamespace() {
    const container = getCurrentContainer();
    return container?.dataset.barbaNamespace || 'home';
}

function getCurrentContainer() {
    const containers = [...document.querySelectorAll('[data-barba="container"]')];
    return containers[containers.length - 1] || null;
}

function initializePage() {
    const namespace = getCurrentNamespace();
    const container = getCurrentContainer();
    const shouldSkipWorkReveal = container?.dataset.workRevealHandled === 'true';
    const homeGrid = container?.querySelector('.double-col-squares');
    const shouldPlayHomeLoader = namespace === 'home'
        && homeGrid?.dataset.revealingFromWork !== 'true'
        && !hasPlayedHomeSquaresIntro
        && !hasPlayedHomeLoader;

    if (namespace === 'home' && !shouldPlayHomeLoader) {
        document.body.classList.remove('home-loader-active');
    }

    resetWorkPageNavigationState();
    ensurePersistentCopyright();
    storeLastSitePage(namespace);
    bindGridToggle();
    bindHomeSquareSelection(namespace);
    if (!shouldPlayHomeLoader && namespace === 'home' && homeGrid?.dataset.revealingFromWork !== 'true' && !hasPlayedHomeSquaresIntro) {
        prepareHomeSquaresReveal(container);
    }
    resetInlineTransforms();
    setStaticSections(namespace);
    bindAboutEntryLinks(namespace);
    bindAboutCloseLink(namespace);
    logoAnimation();
    if (shouldPlayHomeLoader) {
        playHomeLoader();
    } else {
        animateHomeSquaresReveal(namespace);
    }
    heartAnimation();
    bindFreakHover();
    bindWorkPageLogoHome();
    bindWorkPageProjectLinks();
    renderWorkPageTitles(container);
    const titleSequenceDuration = shouldSkipWorkReveal ? 0 : animateWorkPageTitles(container);
    if (!shouldSkipWorkReveal) {
        animateWorkPageGalleryImages(titleSequenceDuration, container);
        animateWorkPageUtilities(titleSequenceDuration, container);
    }
    bindWorkPageThumbSlider();
    syncPersistentWorkIndex(container);

    if (shouldSkipWorkReveal && container) {
        delete container.dataset.workRevealHandled;
    }
}

function syncBodyClasses(nextHtml) {
    if (!nextHtml) return;

    const parser = new DOMParser();
    const nextDocument = parser.parseFromString(nextHtml, 'text/html');
    document.body.className = nextDocument.body.className;
    document.body.setAttribute('data-barba', 'wrapper');
}

function waitForNextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function cubicBezierCoord(a1, a2, t) {
    const mt = 1 - t;
    return (3 * mt * mt * t * a1) + (3 * mt * t * t * a2) + (t * t * t);
}

function easeHomeSquareReveal(t) {
    const clamped = Math.min(1, Math.max(0, t));
    return 1 - Math.pow(1 - clamped, 3);
}

function getHomeSquaresGapSize(grid) {
    if (!(grid instanceof HTMLElement)) return 0;

    const styles = getComputedStyle(grid);
    return parseFloat(styles.columnGap || styles.gap || '0') || 0;
}

function createHomeSquareRevealClone(media, fromRect) {
    if (!(media instanceof HTMLImageElement)) return null;

    const cloneWrapper = document.createElement('div');
    cloneWrapper.setAttribute('aria-hidden', 'true');
    cloneWrapper.className = 'home-square-reveal-clone';
    cloneWrapper.style.position = 'fixed';
    cloneWrapper.style.left = `${fromRect.left}px`;
    cloneWrapper.style.top = `${fromRect.top}px`;
    cloneWrapper.style.width = `${fromRect.width}px`;
    cloneWrapper.style.height = `${fromRect.height}px`;
    cloneWrapper.style.overflow = 'hidden';
    cloneWrapper.style.pointerEvents = 'none';
    cloneWrapper.style.zIndex = '9998';
    cloneWrapper.style.willChange = 'left, top, width, height';

    const clone = document.createElement('img');
    clone.src = media.currentSrc || media.src;
    clone.alt = media.alt || '';
    clone.decoding = media.decoding || 'async';
    clone.className = 'double-col-square-media';
    clone.style.width = '100%';
    clone.style.height = '100%';
    clone.style.objectFit = 'cover';
    clone.style.filter = getComputedStyle(media).filter;

    cloneWrapper.appendChild(clone);
    document.body.appendChild(cloneWrapper);
    return cloneWrapper;
}

function animateHomeSquareRevealClone(clone, fromRect, toRect, duration = 2600, delay = 0) {
    return new Promise(resolve => {
        if (!(clone instanceof HTMLElement) || !fromRect || !toRect) {
            resolve();
            return;
        }

        const startTime = performance.now() + delay;
        const moveDuration = Math.max(1, duration * 0.46);
        const settleDuration = Math.max(45, duration * 0.08);
        const scaleDuration = Math.max(1, duration - moveDuration - settleDuration);
        const settledRect = {
            left: toRect.left + ((toRect.width - fromRect.width) / 2),
            top: toRect.top + ((toRect.height - fromRect.height) / 2),
            width: fromRect.width,
            height: fromRect.height
        };

        function step(now) {
            if (!clone.isConnected) {
                resolve();
                return;
            }

            if (now < startTime) {
                requestAnimationFrame(step);
                return;
            }

            const elapsed = now - startTime;
            let left = toRect.left;
            let top = toRect.top;
            let width = toRect.width;
            let height = toRect.height;

            if (elapsed <= moveDuration) {
                const progress = easeHomeSquareReveal(Math.min(1, elapsed / moveDuration));
                left = fromRect.left + ((settledRect.left - fromRect.left) * progress);
                top = fromRect.top + ((settledRect.top - fromRect.top) * progress);
                width = fromRect.width;
                height = fromRect.height;
            } else if (elapsed <= moveDuration + settleDuration) {
                left = settledRect.left;
                top = settledRect.top;
                width = settledRect.width;
                height = settledRect.height;
            } else {
                const scaleElapsed = elapsed - moveDuration - settleDuration;
                const progress = easeHomeSquareReveal(Math.min(1, scaleElapsed / scaleDuration));
                left = settledRect.left + ((toRect.left - settledRect.left) * progress);
                top = settledRect.top + ((toRect.top - settledRect.top) * progress);
                width = fromRect.width + ((toRect.width - fromRect.width) * progress);
                height = fromRect.height + ((toRect.height - fromRect.height) * progress);
            }

            clone.style.left = `${left}px`;
            clone.style.top = `${top}px`;
            clone.style.width = `${width}px`;
            clone.style.height = `${height}px`;

            if (elapsed < duration) {
                requestAnimationFrame(step);
                return;
            }

            resolve();
        }

        requestAnimationFrame(step);
    });
}

function getNamespaceBackgroundColor(namespace) {
    const colors = {
        home: '#f0f0ef',
        about: '#f0f0ef',
        ttc: '#282828',
        'am-photographer': '#282828',
        msb: '#282828',
    };

    return colors[namespace] || colors.home;
}

function getBackgroundTransitionOverlay() {
    let overlay = document.getElementById('background-transition-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'background-transition-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '2';
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    document.body.appendChild(overlay);

    return overlay;
}

function setDocumentBackgroundColor(color) {
    document.documentElement.style.backgroundColor = color || '';
    document.body.style.backgroundColor = color || '';
}

function primeContainerBackgroundTransition(container, color) {
    if (!color) return;

    const page = container?.querySelector?.('#crxtian-hub_home');
    const overlay = getBackgroundTransitionOverlay();

    document.documentElement.classList.add('is-bg-transitioning');
    document.body.classList.add('is-bg-transitioning');
    setDocumentBackgroundColor(color);
    overlay.style.backgroundColor = color;
    overlay.style.transition = 'none';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';

    if (page) {
        page.style.backgroundColor = 'transparent';
        page.style.transition = 'none';
    }
}

function animateContainerBackground(container, fromColor, toColor, duration = 1600) {
    const page = container?.querySelector?.('#crxtian-hub_home');
    if (!fromColor || !toColor) return Promise.resolve();

    primeContainerBackgroundTransition(container, fromColor);

    if (toColor === fromColor) {
        setDocumentBackgroundColor(toColor);
        if (page) {
            page.style.backgroundColor = 'transparent';
            page.style.transition = 'none';
        }
        return Promise.resolve();
    }

    const overlay = getBackgroundTransitionOverlay();

    return waitForNextFrame().then(() => {
        overlay.style.transition = `background-color ${duration}ms cubic-bezier(0,.5,0,.98)`;
        overlay.style.backgroundColor = toColor;
        setDocumentBackgroundColor(toColor);
    });
}

function clearContainerBackgroundTransition(container, finalColor = '') {
    const page = container?.querySelector?.('#crxtian-hub_home');
    const overlay = document.getElementById('background-transition-overlay');

    setDocumentBackgroundColor(finalColor);

    if (page) {
        page.style.backgroundColor = '';
        page.style.transition = '';
    }

    if (overlay) {
        overlay.style.backgroundColor = '';
        overlay.style.transition = '';
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
    }

    document.documentElement.classList.remove('is-bg-transitioning');
    document.body.classList.remove('is-bg-transitioning');
}

function getAboutPixelTransitionOverlay() {
    let overlay = document.getElementById('about-pixel-transition-overlay');
    if (overlay instanceof HTMLElement) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'about-pixel-transition-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const grid = document.createElement('div');
    grid.className = 'about-pixel-transition-grid';
    overlay.appendChild(grid);
    document.body.appendChild(overlay);

    return overlay;
}

function buildAboutPixelTransitionGrid(overlay) {
    if (!(overlay instanceof HTMLElement)) {
        return { cells: [], columns: 0, rows: 0 };
    }

    const grid = overlay.querySelector('.about-pixel-transition-grid');
    if (!(grid instanceof HTMLElement)) {
        return { cells: [], columns: 0, rows: 0 };
    }

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    const cellSize = Math.max(1, viewportWidth * 0.074);
    const columns = Math.max(1, Math.ceil(viewportWidth / cellSize));
    const rows = Math.max(1, Math.ceil(viewportHeight / cellSize));
    const cellCount = columns * rows;

    grid.style.setProperty('--about-pixel-columns', String(columns));
    grid.style.setProperty('--about-pixel-rows', String(rows));
    grid.innerHTML = '';

    const cells = Array.from({ length: cellCount }, (_, index) => {
        const cell = document.createElement('span');
        cell.className = 'about-pixel-transition-cell';
        cell.dataset.index = String(index);
        grid.appendChild(cell);
        return cell;
    });

    return { cells, columns, rows };
}

function resetAboutPixelTransitionOverlay() {
    const overlay = document.getElementById('about-pixel-transition-overlay');
    if (!(overlay instanceof HTMLElement)) return;

    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    overlay.style.backgroundColor = '';
    overlay.style.transition = '';

    overlay.querySelectorAll('.about-pixel-transition-cell').forEach((cell) => {
        if (!(cell instanceof HTMLElement)) return;
        cell.style.transition = '';
        cell.style.transitionDelay = '';
        cell.style.opacity = '0';
        cell.style.transform = 'scale(.28)';
        cell.style.backgroundColor = '';
    });
}

function playAboutPixelCoverTransition(namespace) {
    const overlay = getAboutPixelTransitionOverlay();
    const { cells, columns } = buildAboutPixelTransitionGrid(overlay);
    if (!cells.length) return Promise.resolve();

    const duration = 320;
    const diagonalWeight = 42;
    const randomWeight = 110;
    let maxDelay = 0;

    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';

    cells.forEach((cell, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        const delay = Math.round(((row + column) * diagonalWeight) + (Math.random() * randomWeight));
        maxDelay = Math.max(maxDelay, delay);

        cell.style.backgroundColor = 'var(--light)';
        cell.style.transition = `opacity ${duration}ms cubic-bezier(.22,1,.36,1), transform ${duration}ms cubic-bezier(.22,1,.36,1)`;
        cell.style.transitionDelay = `${delay}ms`;
    });

    return waitForNextFrame().then(() => {
        cells.forEach((cell) => {
            cell.style.opacity = '1';
            cell.style.transform = 'scale(1.02)';
        });

        return wait(maxDelay + duration + 80);
    });
}

function fadeOutAboutPixelTransitionOverlay(duration = 520) {
    const overlay = document.getElementById('about-pixel-transition-overlay');
    if (!(overlay instanceof HTMLElement)) return Promise.resolve();

    return new Promise(resolve => {
        let settled = false;

        const finish = () => {
            if (settled) return;
            settled = true;
            overlay.removeEventListener('transitionend', onTransitionEnd);
            resetAboutPixelTransitionOverlay();
            resolve();
        };

        const onTransitionEnd = (event) => {
            if (event.target !== overlay || event.propertyName !== 'opacity') return;
            finish();
        };

        overlay.addEventListener('transitionend', onTransitionEnd);
        overlay.style.transition = `opacity ${duration}ms ease`;

        requestAnimationFrame(() => {
            overlay.style.opacity = '0';
        });

        window.setTimeout(finish, duration + 120);
    });
}

function hideContainerTransitionContent(container) {
    const page = container?.querySelector?.('#crxtian-hub_home');
    if (!page) return;

    [...page.children].forEach(child => {
        child.style.opacity = '0';
        child.style.visibility = 'hidden';
    });
}

function showContainerTransitionContent(container) {
    const page = container?.querySelector?.('#crxtian-hub_home');
    if (!page) return;

    [...page.children].forEach(child => {
        child.style.opacity = '';
        child.style.visibility = '';
    });
}

function lockContainerForFadeTransition(container, zIndex) {
    if (!(container instanceof HTMLElement)) return;

    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.width = '100%';
    container.style.zIndex = String(zIndex);
}

function unlockContainerForFadeTransition(container) {
    if (!(container instanceof HTMLElement)) return;

    container.style.position = '';
    container.style.inset = '';
    container.style.width = '';
    container.style.zIndex = '';
    container.style.opacity = '';
    container.style.visibility = '';
    container.style.transition = '';
    container.style.willChange = '';
}

function setFadeTransitionStartState(element, opacity) {
    if (!(element instanceof HTMLElement)) return;

    element.style.opacity = String(opacity);
    element.style.transition = 'none';
    element.style.willChange = 'opacity';
}

function clearFadeTransitionState(element, { clearOpacity = true } = {}) {
    if (!(element instanceof HTMLElement)) return;

    if (clearOpacity) {
        element.style.opacity = '';
    }
    element.style.transition = '';
    element.style.willChange = '';
}

async function animateElementsOpacity(elements, targetOpacity, duration = ABOUT_SCREEN_FADE_DURATION) {
    const validElements = elements.filter(element => element instanceof HTMLElement);
    if (!validElements.length) return;

    validElements.forEach((element) => {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.willChange = 'opacity';
    });

    await waitForNextFrame();

    validElements.forEach((element) => {
        element.style.opacity = String(targetOpacity);
    });

    await wait(duration + 40);
}

function prepareHomeContainerForFadeIn(container) {
    const grid = container?.querySelector?.('.double-col-squares');

    document.body.classList.remove('home-loader-active');
    document.body.classList.remove('home-intro-pending');

    if (!(grid instanceof HTMLElement)) return;

    grid.removeAttribute('data-home-intro-pending');
    grid.removeAttribute('data-revealing-from-work');
    grid.removeAttribute('data-reveal-active');
    grid.style.visibility = '';
    grid.style.opacity = '';

    grid.querySelectorAll('.double-col-square').forEach((square) => {
        if (!(square instanceof HTMLElement)) return;
        square.style.opacity = '';
        square.style.visibility = '';
        square.style.transition = '';
        square.style.transitionDelay = '';
        square.style.transform = '';
    });
}

function showContainerTransitionTitle(container) {
    const titleGrid = container?.querySelector?.('.work-page-title-grid');
    if (!(titleGrid instanceof HTMLElement)) return;

    titleGrid.style.opacity = '';
    titleGrid.style.visibility = '';
}

function showContainerChildForTransition(container, selector) {
    const page = container?.querySelector?.('#crxtian-hub_home');
    const child = page?.querySelector?.(selector);
    if (!(child instanceof HTMLElement)) return null;

    child.style.opacity = '';
    child.style.visibility = '';
    return child;
}

function hideHomeIntroSecondaryContent(container) {
    const page = container?.querySelector?.('#crxtian-hub_home');
    if (!(page instanceof HTMLElement)) return;

    [...page.children].forEach((child) => {
        if (child.classList.contains('double-col-squares')) return;
        delete child.dataset.homeIntroRevealed;
        child.style.opacity = '0';
        child.style.visibility = 'hidden';
        child.style.filter = 'blur(12px)';
    });

    page.querySelectorAll('.double-col-square-index').forEach((index) => {
        if (!(index instanceof HTMLElement)) return;
        delete index.dataset.homeIntroRevealed;
        index.style.opacity = '0';
        index.style.visibility = 'hidden';
        index.style.filter = 'blur(12px)';
    });

    const persistentLogo = document.getElementById('logo-container');
    if (persistentLogo instanceof HTMLElement) {
        if (persistentLogo._homeIntroRevealTimeout) {
            clearTimeout(persistentLogo._homeIntroRevealTimeout);
            persistentLogo._homeIntroRevealTimeout = null;
        }
        delete persistentLogo.dataset.homeIntroRevealed;
        delete persistentLogo.dataset.logoReady;
        delete persistentLogo.dataset.homeIntroRevealPending;
        delete persistentLogo.dataset.homeIntroRevealScheduled;
        persistentLogo.style.opacity = '0';
        persistentLogo.style.visibility = 'hidden';
        persistentLogo.style.filter = 'blur(12px)';
    }
}

function showHomeIntroSecondaryContent(container) {
    const page = container?.querySelector?.('#crxtian-hub_home');
    if (!(page instanceof HTMLElement)) return;

    const reveal = (element) => {
        if (!(element instanceof HTMLElement)) return;
        revealHomeIntroElement(element);
    };

    [...page.children].forEach((child) => {
        if (child.classList.contains('double-col-squares')) return;
        reveal(child);
    });

    page.querySelectorAll('.double-col-square-index').forEach((index) => {
        reveal(index);
    });

    const persistentLogo = document.getElementById('logo-container');
    if (persistentLogo instanceof HTMLElement) {
        if (persistentLogo.dataset.logoReady === 'true' || persistentLogo.children.length > 0) {
            scheduleHomeIntroLogoReveal(persistentLogo);
        } else {
            persistentLogo.dataset.homeIntroRevealPending = 'true';
        }
    }
}

function animateTranslateY(element, fromY, toY, duration = 1300, easing = 'cubic-bezier(0,.5,0,.98)') {
    if (!(element instanceof HTMLElement)) return Promise.resolve();

    return new Promise(resolve => {
        let settled = false;

        const finish = () => {
            if (settled) return;
            settled = true;
            element.removeEventListener('transitionend', onTransitionEnd);
            clearTimeout(timeoutId);
            resolve();
        };

        const onTransitionEnd = (event) => {
            if (event.target !== element || event.propertyName !== 'transform') return;
            finish();
        };

        element.style.transition = 'none';
        element.style.transform = `translate3d(0, ${fromY}, 0)`;

        const timeoutId = setTimeout(finish, duration + 180);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                element.addEventListener('transitionend', onTransitionEnd);
                element.style.transition = `transform ${duration}ms ${easing}`;
                element.style.transform = `translate3d(0, ${toY}, 0)`;
            });
        });
    });
}

function animateScaleOpacityAndLift(
    element,
    {
        fromScale = 1,
        toScale = 1,
        fromY = 0,
        toY = 0,
        fromOpacity = 1,
        toOpacity = 1,
        duration = 1300,
        easing = 'cubic-bezier(0,.5,0,.98)'
    } = {}
) {
    if (!(element instanceof HTMLElement)) return Promise.resolve();

    return new Promise(resolve => {
        let settled = false;
        let completedProps = 0;
        const expectedProps = 2;

        const finish = () => {
            if (settled) return;
            settled = true;
            element.removeEventListener('transitionend', onTransitionEnd);
            clearTimeout(timeoutId);
            resolve();
        };

        const onTransitionEnd = (event) => {
            if (event.target !== element) return;
            if (event.propertyName !== 'transform' && event.propertyName !== 'opacity') return;

            completedProps += 1;
            if (completedProps >= expectedProps) {
                finish();
            }
        };

        element.style.transition = 'none';
        element.style.transform = `translate3d(0, ${fromY}, 0) scale(${fromScale})`;
        element.style.opacity = String(fromOpacity);

        const timeoutId = setTimeout(finish, duration + 150);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                element.addEventListener('transitionend', onTransitionEnd);
                element.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
                element.style.transform = `translate3d(0, ${toY}, 0) scale(${toScale})`;
                element.style.opacity = String(toOpacity);
            });
        });
    });
}

function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutSmoother(t) {
    return t * t * t * (t * ((t * 6) - 15) + 10);
}

function getHomeReturnSquareTranslateYPx(square) {
    if (!(square instanceof HTMLElement)) {
        return { base: 0, start: 0 };
    }

    const styles = getComputedStyle(square);
    const offsetVh = parseFloat(styles.getPropertyValue('--square-offset-y') || '0') || 0;
    const distanceVh = parseFloat(styles.getPropertyValue('--square-return-distance') || '0') || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

    return {
        base: viewportHeight * (offsetVh / 100),
        start: viewportHeight * ((offsetVh + distanceVh) / 100)
    };
}

function setLogoBoxRect(logoContainer, rect) {
    logoContainer.style.left = `${rect.left}px`;
    logoContainer.style.top = `${rect.top}px`;
    logoContainer.style.width = `${rect.width}px`;
    logoContainer.style.height = `${rect.height}px`;
}

function animatePersistentLogo(logoContainer, fromRect, toRect, duration = 2000, easingFn = easeInOutCubic) {
    return new Promise(resolve => {
        const start = performance.now();

        function step(now) {
            const elapsed = now - start;
            const progress = Math.min(1, elapsed / duration);
            const eased = easingFn(progress);
            const left = fromRect.left + ((toRect.left - fromRect.left) * eased);
            const top = fromRect.top + ((toRect.top - fromRect.top) * eased);
            const width = fromRect.width + ((toRect.width - fromRect.width) * eased);
            const height = fromRect.height + ((toRect.height - fromRect.height) * eased);

            logoContainer.style.left = `${left}px`;
            logoContainer.style.top = `${top}px`;
            logoContainer.style.width = `${width}px`;
            logoContainer.style.height = `${height}px`;

            if (progress < 1) {
                logoContainer._logoTransitionRaf = requestAnimationFrame(step);
            } else {
                logoContainer._logoTransitionRaf = null;
                resolve();
            }
        }

        logoContainer._logoTransitionRaf = requestAnimationFrame(step);
    });
}

let logoTransitionState = null;
let backgroundTransitionState = null;
let workMediaTransitionState = null;
let workIndexTransitionState = null;
let workToWorkHeroExitState = null;
let workToWorkHeroEnterState = null;
let workToWorkIndexRevealPending = false;
let pendingWorkProjectDirection = null;
let homeProjectReturnState = null;
const WORK_TO_HOME_TRANSITION_DURATION_MS = 1200;
const WORK_TO_HOME_SQUARE_START_DELAY_MS = Math.round(WORK_TO_HOME_TRANSITION_DURATION_MS * 0.5);
const HOME_PROJECT_SQUARE_STAGGER_MS = 160;
const workPageByNamespace = {
    ttc: 'ThroughTheCurtains.html',
    'am-photographer': 'AMPhotographer.html',
    msb: 'MSBFashionStylist.html'
};

function isNextWorkProjectTrigger(trigger) {
    return trigger instanceof Element && Boolean(trigger.closest('.work-page-project-link-next'));
}

function isPreviousWorkProjectTrigger(trigger) {
    return trigger instanceof Element && Boolean(trigger.closest('.work-page-project-link-prev'));
}

function getWorkProjectTransitionDirection(trigger) {
    if (isNextWorkProjectTrigger(trigger)) return 'next';
    if (isPreviousWorkProjectTrigger(trigger)) return 'previous';
    return pendingWorkProjectDirection;
}

function resolveWorkProjectTransitionDirection(value) {
    if (value === 'next' || value === 'previous') return value;
    return getWorkProjectTransitionDirection(value);
}

function getHomeWorkMediaTrigger(trigger) {
    if (!(trigger instanceof Element)) return null;
    const link = trigger.closest('.double-col-square-link');
    if (!link) return null;
    const media = link.querySelector('.double-col-square-media');
    if (!(media instanceof HTMLImageElement)) return null;
    return media;
}

function getHomeWorkSquare(trigger) {
    if (!(trigger instanceof Element)) return null;
    return trigger.closest('.double-col-square');
}

function getHomeSquareNamespace(square) {
    if (!(square instanceof Element)) return '';

    const link = square.querySelector('.double-col-square-link');
    const href = link?.getAttribute('href') || '';
    const normalizedHref = href.replace(/^\.\//, '');

    const match = Object.entries(workPageByNamespace).find(([, path]) => {
        return normalizedHref.endsWith(path) || href.endsWith(`/${path}`);
    });

    return match?.[0] || '';
}

function getHomeTargetSquareByNamespace(namespace, container) {
    if (!namespace || !container) return null;

    const expectedPath = workPageByNamespace[namespace];
    const links = [...container.querySelectorAll('.double-col-square-link')];
    const targetLink = links.find(link => {
        const href = link.getAttribute('href') || '';
        return href.endsWith(expectedPath) || href.endsWith(`/${expectedPath}`);
    });

    return targetLink?.closest('.double-col-square') || null;
}

function getHomeWorkSquareIndex(square) {
    if (!(square instanceof Element)) return null;
    const index = square.querySelector('.double-col-square-index');
    return index instanceof HTMLElement ? index : null;
}

function getWorkPageHeroMedia(container) {
    return getWorkPageMediaElement(container?.querySelector?.('.work-page-gallery .work-page-image:first-child'));
}

function getWorkPageIndex(container) {
    const index = container?.querySelector?.('.work-page-index');
    return index instanceof HTMLElement ? index : null;
}

function getHomeTargetMediaByNamespace(namespace, container) {
    const targetSquare = getHomeTargetSquareByNamespace(namespace, container);
    const media = targetSquare?.querySelector('.double-col-square-media');
    return media instanceof HTMLImageElement ? media : null;
}

function getWorkPageMediaElement(scope) {
    const media = scope?.querySelector?.('img, video');
    return media instanceof HTMLImageElement || media instanceof HTMLVideoElement ? media : null;
}

function isMediaLoaded(media) {
    if (media instanceof HTMLImageElement) return media.complete;
    if (media instanceof HTMLVideoElement) return media.readyState >= 2;
    return true;
}

function addMediaReadyListener(media, handler) {
    if (media instanceof HTMLImageElement) {
        media.addEventListener('load', handler);
        return () => media.removeEventListener('load', handler);
    }

    if (media instanceof HTMLVideoElement) {
        media.addEventListener('loadeddata', handler);
        return () => media.removeEventListener('loadeddata', handler);
    }

    return () => {};
}

function getHomeTargetIndexByNamespace(namespace, container) {
    const targetSquare = getHomeTargetSquareByNamespace(namespace, container);
    const index = targetSquare?.querySelector('.double-col-square-index');
    return index instanceof HTMLElement ? index : null;
}

function getPersistentWorkIndexElement() {
    let element = document.getElementById('work-index-persistent');
    if (element instanceof SVGSVGElement) return element;

    const svgNs = 'http://www.w3.org/2000/svg';
    element = document.createElementNS(svgNs, 'svg');
    element.id = 'work-index-persistent';
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute('focusable', 'false');

    const text = document.createElementNS(svgNs, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('dominant-baseline', 'text-before-edge');
    element.appendChild(text);

    document.body.appendChild(element);
    return element;
}

function applyPersistentIndexBox(element, rect, styles = {}) {
    if (!(element instanceof SVGSVGElement) || !rect) return;

    const text = element.querySelector('text');
    if (!(text instanceof SVGTextElement)) return;
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;
    element.setAttribute('width', `${width}`);
    element.setAttribute('height', `${height}`);
    element.setAttribute('viewBox', `0 0 ${width} ${height}`);

    text.setAttribute('fill', styles.color || '');
    text.style.fontSize = styles.fontSize || '';
    text.style.fontWeight = styles.fontWeight || '';
    text.style.fontFamily = styles.fontFamily || '';
    text.style.letterSpacing = styles.letterSpacing || '';
    text.style.textTransform = styles.textTransform || '';
    text.style.whiteSpace = 'pre';
}

function showPersistentWorkIndexFromSource(index) {
    if (!(index instanceof HTMLElement)) return null;

    const rect = index.getBoundingClientRect();
    const computed = getComputedStyle(index);
    const sourceSquare = index.closest('.double-col-square');
    const persistentIndex = getPersistentWorkIndexElement();
    const text = persistentIndex.querySelector('text');
    if (!(text instanceof SVGTextElement)) return null;

    sourceSquare?.setAttribute('data-index-transition-hidden', 'true');
    text.textContent = index.textContent || '';
    persistentIndex.style.display = 'block';
    persistentIndex.style.opacity = '1';
    persistentIndex.style.visibility = 'visible';
    persistentIndex.style.willChange = 'left, top, color';
    applyPersistentIndexBox(persistentIndex, rect, {
        color: computed.color,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontFamily: computed.fontFamily,
        letterSpacing: computed.letterSpacing,
        lineHeight: computed.lineHeight,
        textTransform: computed.textTransform
    });

    return {
        element: persistentIndex,
        fromRect: rect,
        sourceSquare,
        sourceColor: computed.color
    };
}

function showPersistentWorkIndexFromWorkPage(index) {
    if (!(index instanceof HTMLElement)) return null;

    const rect = index.getBoundingClientRect();
    const computed = getComputedStyle(index);
    const persistentIndex = getPersistentWorkIndexElement();
    const text = persistentIndex.querySelector('text');
    if (!(text instanceof SVGTextElement)) return null;

    text.textContent = index.textContent || '';
    persistentIndex.style.display = 'block';
    persistentIndex.style.opacity = '1';
    persistentIndex.style.visibility = 'visible';
    persistentIndex.style.willChange = 'left, top, color';
    applyPersistentIndexBox(persistentIndex, rect, {
        color: computed.color,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontFamily: computed.fontFamily,
        letterSpacing: computed.letterSpacing,
        lineHeight: computed.lineHeight,
        textTransform: computed.textTransform
    });

    index.style.opacity = '0';
    index.style.visibility = 'hidden';

    return {
        element: persistentIndex,
        fromRect: rect,
        sourceIndex: index,
        sourceColor: computed.color
    };
}

function releasePersistentSquareIndex(marker) {
    if (!(marker instanceof SVGSVGElement)) return;

    if (marker._indexTransitionRaf) {
        cancelAnimationFrame(marker._indexTransitionRaf);
        marker._indexTransitionRaf = null;
    }

    marker.style.position = '';
    marker.style.left = '';
    marker.style.top = '';
    marker.style.bottom = '';
    marker.style.marginBottom = '';
    marker.style.zIndex = '';
    marker.style.willChange = '';
    marker.style.opacity = '';
    marker.style.filter = '';
    marker.style.transition = '';
}

function settlePersistentSquareIndex(marker) {
    if (!(marker instanceof SVGSVGElement)) return;

    if (marker._indexTransitionRaf) {
        cancelAnimationFrame(marker._indexTransitionRaf);
        marker._indexTransitionRaf = null;
    }

    marker.style.willChange = '';
}

function restoreSourceSquareIndex(state) {
    const square = state?.sourceSquare;
    if (!(square instanceof Element)) return;
    delete square.dataset.indexTransitionHidden;
}

function hidePersistentWorkIndex() {
    const persistentIndex = getPersistentWorkIndexElement();
    const text = persistentIndex.querySelector('text');
    releasePersistentSquareIndex(persistentIndex);
    persistentIndex.style.display = 'none';
    persistentIndex.style.opacity = '0';
    persistentIndex.style.visibility = 'hidden';
    persistentIndex.style.filter = '';
    persistentIndex.style.transition = '';
    if (text instanceof SVGTextElement) {
        text.textContent = '';
    }
}

function animatePersistentWorkIndexOut(duration = 560) {
    const persistentIndex = getPersistentWorkIndexElement();
    if (persistentIndex.style.display === 'none') return Promise.resolve();

    persistentIndex.style.transition = `opacity ${duration}ms ease, filter ${duration}ms ease`;
    persistentIndex.style.opacity = '0';
    persistentIndex.style.filter = 'blur(10px)';

    return new Promise(resolve => {
        window.setTimeout(resolve, duration);
    });
}

function detachPersistentMedia(media) {
    if (
        !(media instanceof HTMLImageElement || media instanceof HTMLVideoElement)
        || !media.parentNode
    ) {
        return null;
    }

    const placeholder = document.createComment('work-media-placeholder');
    const parent = media.parentNode;
    parent.insertBefore(placeholder, media);

    const rect = media.getBoundingClientRect();
    media.style.position = 'fixed';
    media.style.left = `${rect.left}px`;
    media.style.top = `${rect.top}px`;
    media.style.width = `${rect.width}px`;
    media.style.height = `${rect.height}px`;
    media.style.objectFit = 'cover';
    media.style.pointerEvents = 'none';
    media.style.zIndex = '9999';
    media.style.willChange = 'left, top, width, height, filter, opacity';
    media.style.transformOrigin = 'top left';

    document.body.appendChild(media);

    return {
        element: media,
        placeholder,
        fromRect: rect,
        filter: getComputedStyle(media).filter
    };
}

function createPersistentMediaClone(media) {
    if (!(media instanceof HTMLImageElement || media instanceof HTMLVideoElement)) return null;

    const clone = media instanceof HTMLVideoElement
        ? document.createElement('video')
        : document.createElement('img');

    if (media instanceof HTMLVideoElement && clone instanceof HTMLVideoElement) {
        clone.src = media.currentSrc || media.src;
        clone.poster = media.poster || '';
        clone.muted = true;
        clone.defaultMuted = true;
        clone.autoplay = true;
        clone.loop = media.loop;
        clone.playsInline = true;
        clone.preload = 'auto';
    } else if (media instanceof HTMLImageElement && clone instanceof HTMLImageElement) {
        clone.src = media.currentSrc || media.src;
        clone.alt = media.alt || '';
        clone.decoding = media.decoding || 'async';
        clone.loading = 'eager';
    }

    clone.style.position = 'fixed';
    clone.style.objectFit = 'cover';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    clone.style.willChange = 'left, top, width, height, filter, opacity';
    clone.style.transformOrigin = 'top left';
    document.body.appendChild(clone);

    if (clone instanceof HTMLVideoElement) {
        clone.play().catch(() => {
            // Autoplay can be blocked; keep the element visible anyway.
        });
    }

    return {
        element: clone,
        filter: getComputedStyle(media).filter
    };
}

function releasePersistentMedia(media) {
    if (!(media instanceof HTMLImageElement || media instanceof HTMLVideoElement)) return;

    if (media._mediaTransitionRaf) {
        cancelAnimationFrame(media._mediaTransitionRaf);
        media._mediaTransitionRaf = null;
    }

    media.style.position = '';
    media.style.left = '';
    media.style.top = '';
    media.style.width = '';
    media.style.height = '';
    media.style.objectFit = '';
    media.style.pointerEvents = '';
    media.style.zIndex = '';
    media.style.willChange = '';
    media.style.transformOrigin = '';
    media.style.filter = '';
    media.style.opacity = '';
}

function animateTransitionMedia(media, fromRect, toRect, fromFilter = 'none', toFilter = 'none', duration = 1300, easingFn = easeInOutCubic) {
    return new Promise(resolve => {
        const start = performance.now();

        function step(now) {
            const elapsed = now - start;
            const progress = Math.min(1, elapsed / duration);
            const eased = easingFn(progress);
            const left = fromRect.left + ((toRect.left - fromRect.left) * eased);
            const top = fromRect.top + ((toRect.top - fromRect.top) * eased);
            const width = fromRect.width + ((toRect.width - fromRect.width) * eased);
            const height = fromRect.height + ((toRect.height - fromRect.height) * eased);

            media.style.left = `${left}px`;
            media.style.top = `${top}px`;
            media.style.width = `${width}px`;
            media.style.height = `${height}px`;
            media.style.filter = progress < 1 ? fromFilter : toFilter;

            if (progress < 1) {
                media._mediaTransitionRaf = requestAnimationFrame(step);
            } else {
                media._mediaTransitionRaf = null;
                resolve();
            }
        }

        media._mediaTransitionRaf = requestAnimationFrame(step);
    });
}

function getTwoColumnSquareSize() {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const gridWidth = viewportWidth * 0.95;
    const gap = viewportWidth * 0.01;
    const columnWidth = (gridWidth - (gap * 11)) / 12;
    return Math.max(1, (columnWidth * 2) + gap);
}

function getWorkToWorkHeroExitRect(fromRect, direction) {
    const squareSize = getTwoColumnSquareSize();
    const isPrevious = direction === 'previous';
    const left = isPrevious
        ? window.innerWidth + (window.innerWidth * 0.04)
        : -squareSize - (window.innerWidth * 0.04);
    const top = fromRect.top + ((fromRect.height - squareSize) / 2);

    return {
        left,
        top,
        width: squareSize,
        height: squareSize
    };
}

function getWorkToWorkHeroEnterRect(toRect, direction) {
    const squareSize = getTwoColumnSquareSize();
    const isPrevious = direction === 'previous';
    const left = isPrevious
        ? -squareSize - (window.innerWidth * 0.04)
        : window.innerWidth + (window.innerWidth * 0.04);
    const top = toRect.top + ((toRect.height - squareSize) / 2);

    return {
        left,
        top,
        width: squareSize,
        height: squareSize
    };
}

async function animateWorkToWorkHeroExit(container, triggerOrDirection) {
    const direction = resolveWorkProjectTransitionDirection(triggerOrDirection);
    if (!direction) return;

    const sourceMedia = getWorkPageHeroMedia(container);
    if (!sourceMedia) return;

    const mediaState = detachPersistentMedia(sourceMedia);
    if (!mediaState?.element) return;

    workToWorkHeroExitState = mediaState;

    try {
        await animateTransitionMedia(
            mediaState.element,
            mediaState.fromRect,
            getWorkToWorkHeroExitRect(mediaState.fromRect, direction),
            mediaState.filter,
            mediaState.filter,
            1400
        );
    } finally {
        if (mediaState.element.isConnected) {
            mediaState.element.remove();
        }
        releasePersistentMedia(mediaState.element);
        workToWorkHeroExitState = null;
    }
}

async function animateWorkToWorkHeroEnter(container, triggerOrDirection) {
    const direction = resolveWorkProjectTransitionDirection(triggerOrDirection);
    if (!direction) return;

    const targetMedia = getWorkPageMediaElement(container?.querySelector('.work-page-gallery .work-page-image:first-child'));
    if (!targetMedia) return;

    const mediaState = createPersistentMediaClone(targetMedia);
    if (!mediaState?.element) return;

    workToWorkHeroEnterState = mediaState;
    targetMedia.style.opacity = '0';

    try {
        await waitForNextFrame();
        const targetRect = targetMedia.getBoundingClientRect();
        const fromRect = getWorkToWorkHeroEnterRect(targetRect, direction);

        mediaState.element.style.left = `${fromRect.left}px`;
        mediaState.element.style.top = `${fromRect.top}px`;
        mediaState.element.style.width = `${fromRect.width}px`;
        mediaState.element.style.height = `${fromRect.height}px`;
        mediaState.element.style.filter = 'none';

        await animateTransitionMedia(
            mediaState.element,
            fromRect,
            targetRect,
            'none',
            mediaState.filter || 'none',
            1400
        );
    } finally {
        if (mediaState.element.isConnected) {
            mediaState.element.remove();
        }
        releasePersistentMedia(mediaState.element);
        targetMedia.style.opacity = '';
        workToWorkHeroEnterState = null;
    }
}

function animateTransitionIndex(marker, fromRect, toRect, duration = 1550, easingFn = easeInOutCubic) {
    return new Promise(resolve => {
        const start = performance.now();

        function step(now) {
            const elapsed = now - start;
            const progress = Math.min(1, elapsed / duration);
            const eased = easingFn(progress);
            const left = fromRect.left + ((toRect.left - fromRect.left) * eased);
            const top = fromRect.top + ((toRect.top - fromRect.top) * eased);

            marker.style.left = `${left}px`;
            marker.style.top = `${top}px`;

            if (progress < 1) {
                marker._indexTransitionRaf = requestAnimationFrame(step);
            } else {
                marker._indexTransitionRaf = null;
                resolve();
            }
        }

        marker._indexTransitionRaf = requestAnimationFrame(step);
    });
}

function prepareHomeSquaresReveal(container, excludedNamespace) {
    const grid = container?.querySelector?.('.double-col-squares');
    if (!(grid instanceof HTMLElement)) return;

    document.body.classList.add('home-intro-pending');

    const squares = [...grid.querySelectorAll('.double-col-square')];
    squares.forEach((square) => {
        const shouldSkip = getHomeSquareNamespace(square) === excludedNamespace;
        if (shouldSkip) {
            square.dataset.revealSkip = 'true';
        } else {
            delete square.dataset.revealSkip;
        }
    });

    grid.dataset.revealingFromWork = 'true';
    grid.dataset.revealActive = 'false';
    grid.dataset.homeIntroPending = 'true';
    hideHomeIntroSecondaryContent(container);
}

function prepareHomeProjectReturn(container, namespace) {
    const grid = container?.querySelector?.('.double-col-squares');
    if (!(grid instanceof HTMLElement)) return null;

    document.body.classList.remove('home-intro-pending');
    grid.removeAttribute('data-home-intro-pending');
    grid.removeAttribute('data-revealing-from-work');
    grid.removeAttribute('data-reveal-active');
    grid.style.visibility = 'visible';
    grid.style.opacity = '1';

    const squares = [...grid.querySelectorAll('.double-col-square')];
    let selectedSquare = null;

    squares.forEach((square, index) => {
        const isSelected = getHomeSquareNamespace(square) === namespace;
        square.classList.toggle('double-col-square-selected', isSelected);
        square.classList.toggle('double-col-square-return-target', isSelected);
        square.classList.toggle('double-col-square-returning', !isSelected);
        square.classList.toggle('double-col-square-return-visible', isSelected);
        square.style.transitionDelay = isSelected ? '0ms' : `${index * HOME_PROJECT_SQUARE_STAGGER_MS}ms`;
        if (isSelected) {
            square.style.transition = '';
            square.style.transform = '';
            square.style.opacity = '';
            square.style.visibility = '';
        } else {
            square.style.transition = 'none';
            square.style.transform = 'translateY(calc(var(--square-offset-y) + var(--square-return-distance)))';
            square.style.opacity = '0';
            square.style.visibility = 'hidden';
        }
        if (isSelected) {
            selectedSquare = square;
        }
    });

    grid.dataset.projectReturning = 'true';
    grid.dataset.projectLeaving = 'true';
    return { grid, selectedSquare };
}

function animateHomeProjectReturn(grid, duration = WORK_TO_HOME_TRANSITION_DURATION_MS, startDelay = WORK_TO_HOME_SQUARE_START_DELAY_MS) {
    if (!(grid instanceof HTMLElement)) return Promise.resolve();

    const squares = [...grid.querySelectorAll('.double-col-square.double-col-square-returning')];
    const maxDelay = Math.max(0, ...squares.map((_, index) => index * HOME_PROJECT_SQUARE_STAGGER_MS));
    const returnDuration = Math.max(duration, WORK_TO_HOME_TRANSITION_DURATION_MS);

    return new Promise(resolve => {
        grid.getBoundingClientRect();

        requestAnimationFrame(() => {
            squares.forEach((square) => {
                if (!(square instanceof HTMLElement)) return;
                square.style.visibility = 'hidden';
                square.style.opacity = '0';
                square.style.transition = 'none';
            });

            grid.getBoundingClientRect();

            window.setTimeout(() => {
                squares.forEach((square, index) => {
                    if (!(square instanceof HTMLElement)) return;
                    square.style.visibility = '';
                    square.style.opacity = '1';
                    square.style.transitionDelay = `${index * HOME_PROJECT_SQUARE_STAGGER_MS}ms`;
                    square.style.transition = `transform ${returnDuration}ms cubic-bezier(.32, .02, .12, 1), opacity 180ms linear`;
                });

                grid.getBoundingClientRect();

                requestAnimationFrame(() => {
                    squares.forEach((square) => {
                        if (!(square instanceof HTMLElement)) return;
                        square.classList.add('double-col-square-return-visible');
                    });
                    delete grid.dataset.projectLeaving;
                    delete grid.dataset.projectReturning;
                    window.setTimeout(resolve, returnDuration + maxDelay + 80);
                });
            }, startDelay);
        });
    });
}

function resetHomeProjectReturn(grid) {
    if (!(grid instanceof HTMLElement)) return;

    delete grid.dataset.projectLeaving;
    delete grid.dataset.projectReturning;
    grid.style.visibility = '';
    grid.style.opacity = '';
    grid.querySelectorAll('.double-col-square').forEach((square) => {
        square.classList.remove('double-col-square-selected');
        square.classList.remove('double-col-square-leaving');
        square.classList.remove('double-col-square-return-target');
        square.classList.remove('double-col-square-returning');
        square.classList.remove('double-col-square-return-visible');
        square.style.transitionDelay = '';
        square.style.transition = '';
        square.style.transform = '';
        square.style.opacity = '';
        square.style.visibility = '';
    });
}

function settleHomeSquaresReveal(grid, { revealSecondaryContent = true } = {}) {
    if (!(grid instanceof HTMLElement)) return;

    grid.removeAttribute('data-revealing-from-work');
    grid.removeAttribute('data-reveal-active');
    grid.removeAttribute('data-home-intro-pending');
    document.body.classList.remove('home-intro-pending');

    grid.querySelectorAll('.double-col-square').forEach((square) => {
        delete square.dataset.revealSkip;
        square.classList.remove('double-col-square-leaving');
        square.classList.remove('double-col-square-return-target');
        square.classList.remove('double-col-square-returning');
        square.classList.remove('double-col-square-return-visible');
        square.style.transitionDelay = '';
        square.style.transition = '';
        square.style.transform = '';
    });

    if (revealSecondaryContent) {
        showHomeIntroSecondaryContent(getCurrentContainer());
    }
}

function animateHomeSquaresReveal(namespace) {
    if (namespace !== 'home') return;
    if (document.body.classList.contains('home-loader-active')) return;

    const container = getCurrentContainer();
    const grid = container?.querySelector?.('.double-col-squares');
    if (!(grid instanceof HTMLElement)) return;
    if (hasPlayedHomeSquaresIntro) {
        settleHomeSquaresReveal(grid);
        return;
    }
    if (grid.dataset.revealingFromWork !== 'true') return;

    const squaresToAnimate = [...grid.querySelectorAll('.double-col-square')]
        .filter(square => square.dataset.revealSkip !== 'true');

    if (!squaresToAnimate.length) {
        settleHomeSquaresReveal(grid);
        hasPlayedHomeSquaresIntro = true;
        return;
    }

    const gapSize = Math.max(1, getHomeSquaresGapSize(grid));
    const revealDuration = HOME_SQUARE_REVEAL_DURATION;
    const revealMoveDuration = revealDuration * 0.96;
    const revealItems = squaresToAnimate.map((square, index) => {
        const media = square.querySelector('.double-col-square-media');
        if (!(media instanceof HTMLImageElement)) return null;

        const targetRect = media.getBoundingClientRect();
        const fromRect = {
            left: targetRect.left + ((targetRect.width - gapSize) / 2),
            top: window.innerHeight + (gapSize * 1.5) + (index * gapSize * 0.35),
            width: gapSize,
            height: gapSize
        };
        const clone = createHomeSquareRevealClone(media, fromRect);
        if (!clone) return null;

        return {
            clone,
            fromRect,
            targetRect,
            delay: index * HOME_SQUARE_REVEAL_STAGGER_MS
        };
    }).filter(Boolean);

    const maxRevealDelay = revealItems.reduce((max, item) => Math.max(max, item.delay), 0);

    grid.getBoundingClientRect();

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            grid.dataset.revealActive = 'true';
            window.setTimeout(() => {
                showHomeIntroSecondaryContent(container);
            }, maxRevealDelay + revealMoveDuration);

            Promise.all(
                revealItems.map((item) => animateHomeSquareRevealClone(
                    item.clone,
                    item.fromRect,
                    item.targetRect,
                    revealDuration,
                    item.delay
                ))
            ).finally(() => {
                revealItems.forEach((item) => {
                    if (item.clone?.isConnected) item.clone.remove();
                });

                settleHomeSquaresReveal(grid, { revealSecondaryContent: false });
                hasPlayedHomeSquaresIntro = true;
            });
        });
    });
}

function initBarba() {
    barba.hooks.beforeLeave((data) => {
        if (data.current?.namespace === 'about' || data.next?.namespace !== 'about') return;

        setLastSitePage(getPathForNamespace(data.current?.namespace));
    });

    barba.hooks.beforeEnter((data) => {
        if (data.current?.namespace === 'about' && data.next?.namespace !== 'about') {
            return;
        }

        syncBodyClasses(data.next?.html);
    });

    barba.hooks.afterEnter(() => {
        initializePage();
    });

    barba.init({
        transitions: [
            {
                name: 'to-about-fade',
                to: { namespace: ['about'] },
                beforeLeave(data) {
                    lockContainerForFadeTransition(data.current.container, 2);
                },
                beforeEnter(data) {
                    lockContainerForFadeTransition(data.next.container, 1);
                    setFadeTransitionStartState(data.next.container, 0);
                },
                async enter(data) {
                    const logo = document.getElementById('logo-container');

                    try {
                        await animateElementsOpacity([data.current.container, logo], 0);
                        data.current.container.style.visibility = 'hidden';
                        await animateElementsOpacity([data.next.container], 1);
                    } finally {
                        unlockContainerForFadeTransition(data.current.container);
                        unlockContainerForFadeTransition(data.next.container);
                        clearFadeTransitionState(logo);
                    }
                }
            },
            {
                name: 'from-about-fade',
                from: { namespace: ['about'] },
                beforeLeave(data) {
                    lockContainerForFadeTransition(data.current.container, 2);
                },
                beforeEnter(data) {
                    const logo = document.getElementById('logo-container');

                    lockContainerForFadeTransition(data.next.container, 1);
                    setFadeTransitionStartState(data.next.container, 0);
                    setFadeTransitionStartState(logo, 0);
                },
                async enter(data) {
                    const logo = document.getElementById('logo-container');

                    try {
                        await animateElementsOpacity([data.current.container], 0);
                        data.current.container.style.visibility = 'hidden';
                        syncBodyClasses(data.next?.html);
                        if (data.next?.namespace === 'home') {
                            prepareHomeContainerForFadeIn(data.next.container);
                        }
                        await animateElementsOpacity([data.next.container, logo], 1);
                    } finally {
                        unlockContainerForFadeTransition(data.current.container);
                        unlockContainerForFadeTransition(data.next.container);
                        clearFadeTransitionState(logo);
                    }
                }
            },
            {
                name: 'home-to-work-logo',
                from: { namespace: ['home'] },
                to: { namespace: ['ttc', 'am-photographer', 'msb'] },
                async leave(data) {
                    const currentLogo = document.getElementById('logo-container');
                    const media = getHomeWorkMediaTrigger(data.trigger);
                    const square = getHomeWorkSquare(data.trigger);
                    const squareIndex = getHomeWorkSquareIndex(square);
                    startHomeProjectExit(data.trigger);
                    backgroundTransitionState = {
                        fromColor: getNamespaceBackgroundColor(data.current.namespace),
                        toColor: getNamespaceBackgroundColor(data.next.namespace)
                    };
                    primeContainerBackgroundTransition(data.current.container, backgroundTransitionState.fromColor);
                    await new Promise(resolve => setTimeout(resolve, 360));

                    if (!currentLogo || currentLogo.children.length === 0) {
                        logoTransitionState = null;
                    } else {
                        logoTransitionState = {
                            fromRect: currentLogo.getBoundingClientRect(),
                            currentFrame: getCurrentLogoFrameIndex(currentLogo)
                        };
                    }

                    if (!media) {
                        workMediaTransitionState = null;
                    } else {
                        workMediaTransitionState = detachPersistentMedia(media);
                    }

                    workIndexTransitionState = squareIndex ? showPersistentWorkIndexFromSource(squareIndex) : null;
                },
                beforeEnter(data) {
                    document.body.classList.remove('home-intro-pending');
                    document.body.classList.remove('home-loader-active');
                    data.next.container.style.position = 'fixed';
                    data.next.container.style.inset = '0';
                    data.next.container.style.width = '100%';
                    data.next.container.style.zIndex = '5';
                    showContainerTransitionContent(data.next.container);
                },
                async enter(data) {
                    const logoState = logoTransitionState;
                    const bgState = backgroundTransitionState;
                    const persistentLogo = document.getElementById('logo-container');
                    const mediaState = workMediaTransitionState;
                    const indexState = workIndexTransitionState;
                    const targetMedia = getWorkPageMediaElement(data.next.container.querySelector('.work-page-image'));
                    const targetIndex = data.next.container.querySelector('.work-page-index');
                    const persistentMedia = mediaState?.element || null;
                    const persistentIndex = indexState?.element || null;
                    const homeToWorkDuration = 1900;
                    const homeToWorkEase = easeInOutSmoother;

                    if ((!logoState || !persistentLogo) && !mediaState && !indexState && !bgState?.fromColor) {
                        showContainerTransitionContent(data.next.container);
                        logoTransitionState = null;
                        backgroundTransitionState = null;
                        workMediaTransitionState = null;
                        workIndexTransitionState = null;
                        return;
                    }

                    try {
                        if (logoState && persistentLogo) {
                            startLogoFrameLoop(persistentLogo, logoState.currentFrame);
                        }
                        if (targetMedia) {
                            targetMedia.style.transition = 'opacity 420ms ease';
                            targetMedia.style.opacity = '0';
                        }
                        const backgroundAnimation = animateContainerBackground(
                            data.next.container,
                            bgState?.fromColor || '',
                            bgState?.toColor || '',
                            homeToWorkDuration
                        );

                        await waitForNextFrame();
                        const logoTargetRect = persistentLogo?.getBoundingClientRect() || null;
                        const targetMediaRect = targetMedia?.getBoundingClientRect() || null;
                        const targetIndexRect = targetIndex?.getBoundingClientRect() || null;
                        const targetIndexColor = targetIndex ? getComputedStyle(targetIndex).color : '';
                        if (logoState && persistentLogo && logoTargetRect) {
                            persistentLogo.style.willChange = 'left, top, width, height';
                            setLogoBoxRect(persistentLogo, logoState.fromRect);
                        }

                        if (persistentIndex instanceof SVGSVGElement && targetIndexColor) {
                            const text = persistentIndex.querySelector('text');
                            if (text instanceof SVGTextElement) {
                                text.setAttribute('fill', targetIndexColor);
                            }
                        }

                        renderWorkPageTitles(data.next.container);
                        showContainerTransitionTitle(data.next.container);
                        animateWorkPageTitles(data.next.container);

                        if (targetMedia) {
                            window.setTimeout(() => {
                                if (targetMedia.isConnected) {
                                    targetMedia.style.opacity = '1';
                                }
                            }, Math.max(0, homeToWorkDuration - 320));
                        }

                        await Promise.all([
                            backgroundAnimation,
                            logoState && persistentLogo && logoTargetRect
                                ? animatePersistentLogo(
                                    persistentLogo,
                                    logoState.fromRect,
                                    logoTargetRect,
                                    homeToWorkDuration,
                                    homeToWorkEase
                                )
                                : Promise.resolve(),
                            persistentMedia && targetMediaRect
                                ? animateTransitionMedia(
                                    persistentMedia,
                                    mediaState.fromRect,
                                    targetMediaRect,
                                    mediaState.filter,
                                    'none',
                                    homeToWorkDuration,
                                    homeToWorkEase
                                )
                                : Promise.resolve(),
                            persistentIndex && targetIndexRect
                                ? animateTransitionIndex(
                                    persistentIndex,
                                    indexState.fromRect,
                                    targetIndexRect,
                                    homeToWorkDuration,
                                    homeToWorkEase
                                )
                                : Promise.resolve()
                        ]);

                        if (persistentIndex && targetIndex instanceof HTMLElement) {
                            const settledRect = targetIndex.getBoundingClientRect();
                            const settledStyles = getComputedStyle(targetIndex);
                            applyPersistentIndexBox(persistentIndex, settledRect, {
                                color: targetIndexColor || settledStyles.color,
                                fontSize: settledStyles.fontSize,
                                fontWeight: settledStyles.fontWeight,
                                fontFamily: settledStyles.fontFamily,
                                letterSpacing: settledStyles.letterSpacing,
                                lineHeight: settledStyles.lineHeight,
                                textTransform: settledStyles.textTransform
                            });
                        }
                        showContainerTransitionContent(data.next.container);

                    } finally {
                        if (persistentLogo?._logoTransitionRaf) {
                            cancelAnimationFrame(persistentLogo._logoTransitionRaf);
                            persistentLogo._logoTransitionRaf = null;
                        }
                        if (persistentMedia?.isConnected) {
                            persistentMedia.remove();
                            releasePersistentMedia(persistentMedia);
                        }
                        settlePersistentSquareIndex(persistentIndex);
                        if (targetMedia) {
                            targetMedia.style.transition = '';
                            targetMedia.style.opacity = '';
                        }
                        if (persistentLogo) {
                            persistentLogo.style.left = '';
                            persistentLogo.style.top = '';
                            persistentLogo.style.width = '';
                            persistentLogo.style.height = '';
                            persistentLogo.style.willChange = '';
                        }
                        data.next.container.style.position = '';
                        data.next.container.style.inset = '';
                        data.next.container.style.width = '';
                        data.next.container.style.zIndex = '';
                        logoTransitionState = null;
                        clearContainerBackgroundTransition(data.next.container, bgState?.toColor || '');
                        backgroundTransitionState = null;
                        workMediaTransitionState = null;
                        workIndexTransitionState = null;
                    }
                }
            },
            {
                name: 'work-to-home-logo',
                from: { namespace: ['ttc', 'am-photographer', 'msb'] },
                to: { namespace: ['home'] },
                async leave(data) {
                    const currentLogo = document.getElementById('logo-container');
                    const sourceMedia = getWorkPageHeroMedia(data.current.container);
                    const sourceIndex = getWorkPageIndex(data.current.container);
                    data.current.container.style.position = 'relative';
                    data.current.container.style.zIndex = '4';
                    backgroundTransitionState = {
                        fromColor: getNamespaceBackgroundColor(data.current.namespace),
                        toColor: getNamespaceBackgroundColor(data.next.namespace)
                    };
                    primeContainerBackgroundTransition(data.current.container, backgroundTransitionState.fromColor);
                    workMediaTransitionState = sourceMedia ? detachPersistentMedia(sourceMedia) : null;
                    workIndexTransitionState = sourceIndex ? showPersistentWorkIndexFromWorkPage(sourceIndex) : null;
                    await animateWorkPageTitlesOut(data.current.container);
                    hideContainerTransitionContent(data.current.container);

                    if (!currentLogo || currentLogo.children.length === 0) {
                        logoTransitionState = null;
                    } else {
                        logoTransitionState = {
                            fromRect: currentLogo.getBoundingClientRect(),
                            currentFrame: getCurrentLogoFrameIndex(currentLogo)
                        };
                    }
                },
                beforeEnter(data) {
                    document.body.classList.remove('home-intro-pending');
                    data.next.container.style.position = 'fixed';
                    data.next.container.style.inset = '0';
                    data.next.container.style.width = '100%';
                    data.next.container.style.zIndex = '6';
                    hideContainerTransitionContent(data.next.container);
                    homeProjectReturnState = prepareHomeProjectReturn(data.next.container, data.current.namespace);
                },
                async enter(data) {
                    const state = logoTransitionState;
                    const bgState = backgroundTransitionState;
                    const persistentLogo = document.getElementById('logo-container');
                    const mediaState = workMediaTransitionState;
                    const indexState = workIndexTransitionState;
                    const persistentMedia = mediaState?.element || null;
                    const persistentIndex = indexState?.element || null;
                    const targetMedia = getHomeTargetMediaByNamespace(data.current.namespace, data.next.container);
                    const targetSquare = getHomeTargetSquareByNamespace(data.current.namespace, data.next.container);
                    const targetIndex = getHomeTargetIndexByNamespace(data.current.namespace, data.next.container);
                    const homeReturnState = homeProjectReturnState || prepareHomeProjectReturn(data.next.container, data.current.namespace);
                    const homeGrid = homeReturnState?.grid || null;
                    const workToHomeDuration = WORK_TO_HOME_TRANSITION_DURATION_MS;
                    const workToHomeEase = easeInOutSmoother;

                    if ((!state || !persistentLogo) && !persistentMedia && !persistentIndex && !bgState?.fromColor) {
                        document.body.classList.remove('home-intro-pending');
                        showContainerTransitionContent(data.next.container);
                        resetHomeProjectReturn(homeGrid);
                        logoTransitionState = null;
                        backgroundTransitionState = null;
                        workMediaTransitionState = null;
                        workIndexTransitionState = null;
                        return;
                    }

                    try {
                        if (state && persistentLogo) {
                            startLogoFrameLoop(persistentLogo, state.currentFrame);
                        }
                        if (targetMedia) {
                            targetMedia.style.opacity = '0';
                        }
                        if (targetSquare) {
                            targetSquare.setAttribute('data-index-transition-hidden', 'true');
                        }
                        showContainerChildForTransition(data.next.container, '.double-col-squares');
                        const backgroundAnimation = animateContainerBackground(
                            data.next.container,
                            bgState?.fromColor || '',
                            bgState?.toColor || ''
                        );

                        await waitForNextFrame();
                        const toRect = state && persistentLogo ? persistentLogo.getBoundingClientRect() : null;
                        const targetMediaRect = targetMedia?.getBoundingClientRect() || null;
                        const targetMediaFilter = targetMedia ? getComputedStyle(targetMedia).filter : 'none';
                        const targetIndexRect = targetIndex?.getBoundingClientRect() || null;
                        const targetIndexColor = targetIndex ? getComputedStyle(targetIndex).color : '';
                        if (state && persistentLogo) {
                            persistentLogo.style.willChange = 'left, top, width, height';
                            setLogoBoxRect(persistentLogo, state.fromRect);
                        }
                        if (persistentIndex instanceof SVGSVGElement && targetIndexColor) {
                            const text = persistentIndex.querySelector('text');
                            if (text instanceof SVGTextElement) {
                                text.setAttribute('fill', targetIndexColor);
                            }
                        }
                        await Promise.all([
                            backgroundAnimation,
                            state && persistentLogo && toRect
                                ? animatePersistentLogo(
                                    persistentLogo,
                                    state.fromRect,
                                    toRect,
                                    workToHomeDuration,
                                    workToHomeEase
                                )
                                : Promise.resolve(),
                            persistentMedia && targetMediaRect
                                ? animateTransitionMedia(
                                    persistentMedia,
                                    mediaState.fromRect,
                                    targetMediaRect,
                                    mediaState.filter,
                                    targetMediaFilter,
                                    workToHomeDuration,
                                    workToHomeEase
                                )
                                : Promise.resolve(),
                            persistentIndex && targetIndexRect
                                ? animateTransitionIndex(
                                    persistentIndex,
                                    indexState.fromRect,
                                    targetIndexRect,
                                    workToHomeDuration,
                                    workToHomeEase
                                )
                                : Promise.resolve(),
                            animateHomeProjectReturn(homeGrid, workToHomeDuration, WORK_TO_HOME_SQUARE_START_DELAY_MS)
                        ]);
                        if (persistentIndex && targetIndex instanceof HTMLElement) {
                            const settledRect = targetIndex.getBoundingClientRect();
                            const settledStyles = getComputedStyle(targetIndex);
                            applyPersistentIndexBox(persistentIndex, settledRect, {
                                color: targetIndexColor || settledStyles.color,
                                fontSize: settledStyles.fontSize,
                                fontWeight: settledStyles.fontWeight,
                                fontFamily: settledStyles.fontFamily,
                                letterSpacing: settledStyles.letterSpacing,
                                lineHeight: settledStyles.lineHeight,
                                textTransform: settledStyles.textTransform
                            });
                        }
                        hasPlayedHomeSquaresIntro = true;
                        showContainerTransitionContent(data.next.container);
                    } finally {
                        if (persistentLogo?._logoTransitionRaf) {
                            cancelAnimationFrame(persistentLogo._logoTransitionRaf);
                            persistentLogo._logoTransitionRaf = null;
                        }
                        if (persistentLogo) {
                            persistentLogo.style.left = '';
                            persistentLogo.style.top = '';
                            persistentLogo.style.width = '';
                            persistentLogo.style.height = '';
                            persistentLogo.style.willChange = '';
                        }
                        if (persistentMedia?.isConnected) {
                            persistentMedia.remove();
                            releasePersistentMedia(persistentMedia);
                        }
                        if (targetMedia) {
                            targetMedia.style.opacity = '';
                        }
                        settlePersistentSquareIndex(persistentIndex);
                        if (targetSquare) {
                            delete targetSquare.dataset.indexTransitionHidden;
                        }
                        resetHomeProjectReturn(homeGrid);
                        hidePersistentWorkIndex();
                        data.next.container.style.position = '';
                        data.next.container.style.inset = '';
                        data.next.container.style.width = '';
                        data.next.container.style.zIndex = '';
                        logoTransitionState = null;
                        clearContainerBackgroundTransition(data.next.container, bgState?.toColor || '');
                        backgroundTransitionState = null;
                        workMediaTransitionState = null;
                        workIndexTransitionState = null;
                        homeProjectReturnState = null;
                    }
                }
            },
            {
                name: 'work-to-work-title',
                from: { namespace: ['ttc', 'am-photographer', 'msb'] },
                to: { namespace: ['ttc', 'am-photographer', 'msb'] },
                async leave(data) {
                    const direction = pendingWorkProjectDirection || getWorkProjectTransitionDirection(data.trigger);
                    await ensureWorkPageAtTopBeforeNavigate(data.current.container);
                    data.current.container.style.position = 'relative';
                    data.current.container.style.zIndex = '6';
                    backgroundTransitionState = {
                        fromColor: getNamespaceBackgroundColor(data.current.namespace),
                        toColor: getNamespaceBackgroundColor(data.next.namespace)
                    };
                    primeContainerBackgroundTransition(data.current.container, backgroundTransitionState.fromColor);
                    await Promise.all([
                        animateWorkPageTitlesOut(data.current.container),
                        animateWorkPageFrameOut(data.current.container),
                        animateWorkToWorkHeroExit(data.current.container, direction),
                        animatePersistentWorkIndexOut()
                    ]);
                    data.current.container.style.pointerEvents = 'none';
                },
                beforeEnter(data) {
                    data.next.container.style.position = 'fixed';
                    data.next.container.style.inset = '0';
                    data.next.container.style.width = '100%';
                    data.next.container.style.zIndex = '5';
                    hideContainerTransitionContent(data.next.container);
                },
                async enter(data) {
                    const direction = pendingWorkProjectDirection || getWorkProjectTransitionDirection(data.trigger);
                    const bgState = backgroundTransitionState;
                    const shouldAnimateHero = Boolean(direction);
                    const nextContainer = data.next.container;
                    const targetMedia = shouldAnimateHero
                        ? getWorkPageMediaElement(nextContainer.querySelector('.work-page-gallery .work-page-image:first-child'))
                        : null;

                    try {
                        renderWorkPageTitles(nextContainer);
                        prepareWorkPageEntranceState(nextContainer);
                        showContainerTransitionTitle(nextContainer);
                        showContainerTransitionContent(nextContainer);
                        const titleSequenceDuration = animateWorkPageTitles(nextContainer, { forceRestart: true });
                        const backgroundAnimation = animateContainerBackground(
                            nextContainer,
                            bgState?.fromColor || '',
                            bgState?.toColor || ''
                        );

                        await Promise.all([
                            backgroundAnimation,
                            new Promise(resolve => setTimeout(resolve, 480)),
                            animateWorkToWorkHeroEnter(nextContainer, direction)
                        ]);
                        workToWorkIndexRevealPending = true;

                        animateWorkPageGalleryImages(0, nextContainer);
                        animateWorkPageUtilities(0, nextContainer);
                        syncPersistentWorkIndex(nextContainer);
                        nextContainer.dataset.workRevealHandled = 'true';
                    } finally {
                        if (workToWorkHeroExitState?.element?.isConnected) {
                            workToWorkHeroExitState.element.remove();
                            releasePersistentMedia(workToWorkHeroExitState.element);
                        }
                        if (workToWorkHeroEnterState?.element?.isConnected) {
                            workToWorkHeroEnterState.element.remove();
                            releasePersistentMedia(workToWorkHeroEnterState.element);
                        }
                        if (targetMedia) {
                            targetMedia.style.opacity = '';
                        }
                        data.current.container.style.pointerEvents = '';
                        data.current.container.style.zIndex = '';
                        workToWorkHeroExitState = null;
                        workToWorkHeroEnterState = null;
                        nextContainer.style.position = '';
                        nextContainer.style.inset = '';
                        nextContainer.style.width = '';
                        nextContainer.style.zIndex = '';
                        clearContainerBackgroundTransition(nextContainer, bgState?.toColor || '');
                        backgroundTransitionState = null;
                    }
                }
            }
        ]
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initBarba();
    initializePage();
});
