import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { storyChapters, storyDuration as duration, galleryTimings, stackReveal } from '../data/story';
import { initSkillTree } from './skill-tree';
import type { NeuralCore } from './neural-core';
import { sfx } from './sfx';

const chapterTimes = storyChapters.map(chapter => chapter.at);
// The career timeline climbs the D pentatonic one milestone at a time (D E G A B D), all inside the sound set's D/A fifth.
const STEP_RATE = [0, 2, 5, 7, 9, 12].map(semitones => 2 ** (semitones / 12));

export function initStory() {
  const root = document.querySelector<HTMLElement>('[data-story]');
  if (!root) return;
  const stage = root.querySelector<HTMLElement>('.story-stage')!;
  const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-scene]'));
  const toggle = root.querySelector<HTMLButtonElement>('[data-motion-toggle]')!;
  const toggleLabel = root.querySelector<HTMLElement>('[data-motion-label]')!;
  const soundToggle = root.querySelector<HTMLButtonElement>('[data-sound-toggle]');
  const soundLabel = root.querySelector<HTMLElement>('[data-sound-label]');
  const soundInvites = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-sound-invite]'));
  // Sound: one switch in the header, remembered; the first click on the core or a hub with sound off earns one
  // four-second invitation in the readout nearest the action, never on load and never twice in a session.
  const syncSound = (on: boolean) => {
    root.dataset.sound = on ? 'on' : 'off';
    soundToggle?.setAttribute('aria-pressed', String(on));
    soundToggle?.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
    if (soundToggle) soundToggle.title = on ? 'Sound on' : 'Sound off';
    if (soundLabel) soundLabel.textContent = on ? 'Sound on' : 'Sound off';
    if (on) soundInvites.forEach(chip => { chip.hidden = true; });
  };
  syncSound(sfx.enabled);
  sfx.onChange(syncSound);
  soundToggle?.addEventListener('click', () => sfx.toggle());
  addEventListener('pointerdown', () => sfx.prime(), { once: true, passive: true });
  // Cues that follow scrolling (chapter shifts, timeline stops) wait for the first gesture, so landing on a hash stays quiet.
  let gestured = false;
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(type => addEventListener(type, () => { gestured = true; }, { once: true, passive: true, capture: true }));
  let invited = false;
  let inviteTimer = 0;
  const inviteSound = (chip: HTMLButtonElement | undefined, replay: () => void) => {
    if (invited || sfx.enabled || !chip) return;
    invited = true;
    chip.hidden = false;
    chip.onclick = () => { clearTimeout(inviteTimer); chip.hidden = true; sfx.setEnabled(true); replay(); };
    inviteTimer = window.setTimeout(() => { chip.hidden = true; }, 4000);
  };
  const heroInvite = soundInvites.find(chip => chip.closest('.core-art'));
  const treeInvite = soundInvites.find(chip => chip.closest('[data-skill-tree]'));
  const progress = root.querySelector<HTMLElement>('[data-story-progress]')!;
  const atlas = document.querySelector<HTMLDialogElement>('[data-atlas]')!;
  const atlasSearch = atlas.querySelector<HTMLInputElement>('[data-atlas-search]')!;
  const atlasLinks = Array.from(atlas.querySelectorAll<HTMLAnchorElement>('[data-atlas-chapter]'));
  const atlasTrigger = root.querySelector<HTMLButtonElement>('[data-atlas-open]')!;
  const galleries = Object.entries(galleryTimings).map(([id, timing]) => {
    const viewport = root.querySelector<HTMLElement>(`[data-horizontal="${id}"]`)!;
    const track = viewport.querySelector<HTMLElement>('[data-horizontal-track]')!;
    return { id, viewport, track, ...timing, distance: () => Math.max(0, track.scrollWidth - viewport.clientWidth) };
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 700px)');
  const short = matchMedia('(max-height: 700px), (max-width: 700px) and (max-height: 800px)');
  let preference: string | null = null;
  try { preference = localStorage.getItem('portfolio-motion'); } catch (error) {
    console.warn('Motion preferences cannot be read; using your device preference.', error);
  }
  let requestedMotion = preference !== 'off' && !reduced.matches;
  let context: gsap.Context | undefined;
  let timeline: gsap.core.Timeline | undefined;
  const stopWatchers: Array<() => void> = [];
  let currentScene = 0;
  let blockClickUntil = 0;
  const animated = () => root.dataset.motion === 'on';
  // The WebGL core is an enhancement over the poster: wide screens with motion on only, loaded after the page settles.
  const coreHost = root.querySelector<HTMLElement>('[data-core-model]');
  const wide = matchMedia('(min-width: 768px)');
  let core: NeuralCore | undefined;
  let coreRequested = false;
  const syncCore = () => core?.setRunning(animated() && currentScene === 0 && !document.hidden);
  // The Blender loops replace each tile's poster once it plays. Never fetched with reduced motion or motion switched off;
  // short screens keep them, since only the scroll timeline is too much there. Safari gets HEVC alpha, the rest VP9 alpha.
  const systemsScene = scenes.findIndex(scene => scene.id === 'systems');
  const loopFrames = Array.from(root.querySelectorAll<HTMLElement>('[data-loop]'));
  const loopExt = navigator.vendor === 'Apple Computer, Inc.' ? 'mp4' : 'webm';
  const inView = new Set<HTMLElement>();
  let loopsOpen = false;
  const syncLoops = () => {
    const allowed = requestedMotion && !reduced.matches && !document.hidden && !loopsOpen && (!animated() || currentScene === systemsScene);
    loopFrames.forEach(frame => {
      let video = frame.querySelector('video');
      if (!allowed || !inView.has(frame)) { video?.pause(); return; }
      if (!video) {
        video = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, preload: 'auto' });
        video.setAttribute('aria-hidden', 'true');
        video.addEventListener('playing', () => frame.classList.add('is-playing'), { once: true });
        video.src = `${frame.dataset.loop}.${loopExt}`;
        frame.append(video);
      }
      video.play().catch(() => { /* Autoplay refused (Low Power Mode, data saver): the poster stays. */ });
    });
  };
  const loopWatcher = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? inView.add(entry.target as HTMLElement) : inView.delete(entry.target as HTMLElement));
    syncLoops();
  }, { rootMargin: '120px 0px' });
  loopFrames.forEach(frame => loopWatcher.observe(frame));
  const mountCore = () => {
    if (coreRequested || !coreHost || !animated() || !wide.matches || !('WebGL2RenderingContext' in window)) return;
    coreRequested = true;
    import('./neural-core')
      .then(({ createNeuralCore }) => createNeuralCore(coreHost, coreHost.dataset.coreModel!, {
        // Only the click speaks: dragging and the idle spin stay silent.
        onInteract: kind => {
          if (kind !== 'pulse') return;
          if (sfx.enabled) sfx.play('hero-pulse');
          else inviteSound(heroInvite, () => core?.pulse());
        },
      }))
      .then(instance => {
        core = instance;
        const hintEl = root.querySelector('.core-interaction');
        if (hintEl) hintEl.textContent = 'Drag to spin · Click to pulse';
        syncCore();
      })
      .catch(error => console.warn('The 3D core could not start; keeping the still image.', error));
  };
  const scheduleCore = () => {
    const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(mountCore, { timeout: 2000 }) : setTimeout(mountCore, 600));
    if (document.readyState === 'complete') idle();
    else addEventListener('load', idle, { once: true });
  };
  const scrollForTime = (time: number, smooth = false) => {
    const trigger = timeline?.scrollTrigger;
    if (!trigger) return;
    window.scrollTo({
      top: trigger.start + (trigger.end - trigger.start) * time / duration,
      behavior: smooth ? 'smooth' : 'instant',
    });
  };
  // The Skill Tree runs the Stack chapter; a phone tab scrolls the story to that branch page.
  const tree = initSkillTree(root.querySelector<HTMLElement>('[data-skill-tree]')!, {
    compact, reduced,
    sound: (name, options) => { const will = sfx.wouldPlay(name); if (will) sfx.play(name, options); return will; },
    inviteSound: replay => inviteSound(treeInvite, replay),
    scrollToStep: (step, steps) => scrollForTime(stackReveal.start + (step / steps) * 0.85 * (stackReveal.end - stackReveal.start) + 0.03),
  });
  const activeScene = (index: number) => {
    const previous = currentScene;
    currentScene = index;
    // The chapter crossfade speaks once per shift, a tone lower on the way back.
    if (index !== previous && gestured && animated()) sfx.play('scene-shift', { rate: index > previous ? 1 : 0.891 });
    scenes.forEach((scene, i) => {
      if (animated()) {
        scene.inert = i !== index;
        scene.setAttribute('aria-hidden', String(i !== index));
      } else {
        scene.inert = false;
        scene.removeAttribute('aria-hidden');
      }
    });
    root.querySelectorAll<HTMLAnchorElement>('.story-timeline a').forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    atlasLinks.forEach(link => {
      if (link.dataset.atlasChapter === scenes[index].id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    root.querySelectorAll<HTMLAnchorElement>('.story-header-links a').forEach(link => {
      if (link.dataset.chapter === scenes[index].id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    syncCore();
    syncLoops();
  };
  const goTo = (id: string, smooth = true) => {
    const index = scenes.findIndex(scene => scene.id === id);
    if (index < 0) return;
    if (animated()) scrollForTime(chapterTimes[index] + (index ? 0.12 : 0), smooth);
    else scenes[index].scrollIntoView({ behavior: 'instant', block: 'start' });
  };
  const setup = () => {
    context?.revert();
    timeline = undefined;
    root.dataset.motion = requestedMotion && !reduced.matches && !short.matches ? 'on' : 'off';
    document.documentElement.dataset.storyMotion = root.dataset.motion;
    tree.setMode(animated());
    stage.style.removeProperty('--orbit-x');
    stage.style.removeProperty('--orbit-y');
    toggle.setAttribute('aria-pressed', String(animated()));
    toggle.setAttribute('aria-label', animated() ? 'Disable animations' : 'Enable animations');
    toggleLabel.textContent = animated() ? 'Motion on' : 'Motion off';
    toggle.disabled = short.matches || reduced.matches;
    toggle.title = reduced.matches ? 'Animations follow your device reduced-motion preference.' : short.matches ? 'A taller viewport is needed for the animated stage.' : '';
    root.dataset.initialized = 'true';
    activeScene(currentScene);
    if (!animated()) {
      root.style.removeProperty('height');
      progress.style.transform = 'scaleX(0)';
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    context = gsap.context(() => {
      gsap.set(scenes, { autoAlpha: 0 });
      gsap.set(scenes[0], { autoAlpha: 1 });
      gsap.set(progress, { scaleX: 0, transformOrigin: 'left' });
      timeline = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          const time = timeline?.time() ?? 0;
          let index = 0;
          chapterTimes.forEach((at, i) => { if (time >= at - 0.32) index = i; });
          if (index !== currentScene) activeScene(index);
          stopWatchers.forEach(watch => watch());
          tree.setProgress((time - stackReveal.start) / (stackReveal.end - stackReveal.start));
          progress.style.transform = `scaleX(${time / duration})`;
          core?.setOpen((time - 0.65) / 0.75);
        },
      });
      for (let i = 1; i < scenes.length; i++) {
        const at = chapterTimes[i] - 0.65;
        timeline.to(scenes[i - 1], { autoAlpha: 0, yPercent: -13, scale: 1.08, duration: 0.55 }, at)
          .fromTo(scenes[i], { autoAlpha: 0, yPercent: 13, scale: 0.97 }, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.65 }, at + 0.1);
      }
      storyChapters.slice(1).forEach(chapter => {
        timeline!.to(stage, { backgroundColor: chapter.color, duration: 0.7 }, chapter.at - 0.7);
      });
      timeline.to('.core-art', { xPercent: 10, yPercent: -8, scale: 0.88, opacity: 0.6, duration: 0.75 }, 0.65)
        .fromTo('.flow-node', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 5.95)
        .fromTo('.st-stage', { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }, 7.3)
        .fromTo('.st-hud', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 7.45)
        .fromTo('.doha-art', { y: 40, opacity: 0.4 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }, 9.95)
        .to({}, { duration: 0.8 }, duration - 0.8);
      galleries.forEach(({ track, start, end, distance }) => {
        timeline!.fromTo(track, { x: 0 }, { x: () => -distance(), duration: end - start, ease: 'none' }, start);
      });
      gsap.fromTo('.intro-eyebrow', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.15 });
      gsap.fromTo('.scene-intro h1 span', { yPercent: 55, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out' });
    }, root);
    ScrollTrigger.refresh();
    scheduleCore();
  };

  let atlasOpener: HTMLElement | null = null;
  let atlasDestination: string | null = null;
  const filterAtlas = () => {
    const words = atlasSearch.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    atlasLinks.forEach(link => {
      link.hidden = !words.every(word => link.dataset.atlasTerms!.includes(word));
      if (!link.hidden) count++;
    });
    atlas.querySelector<HTMLElement>('[data-atlas-empty]')!.hidden = count !== 0;
    atlas.querySelector<HTMLElement>('[data-atlas-results]')!.textContent = `${count} ${count === 1 ? 'chapter' : 'chapters'} available`;
  };
  const openAtlas = () => {
    if (atlas.open || document.querySelector('dialog[open]')) return;
    atlasOpener = document.activeElement instanceof HTMLElement ? document.activeElement : atlasTrigger;
    atlasDestination = null;
    atlasSearch.value = '';
    filterAtlas();
    atlas.showModal();
    document.documentElement.classList.add('story-viewer-open');
    if (matchMedia('(pointer: fine)').matches) atlasSearch.focus();
    else atlas.querySelector<HTMLButtonElement>('[data-atlas-close]')!.focus();
  };
  atlasTrigger.addEventListener('click', openAtlas);
  atlas.querySelector('[data-atlas-close]')!.addEventListener('click', () => atlas.close());
  atlas.addEventListener('click', event => {
    if (event.target !== atlas) return;
    const bounds = atlas.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) atlas.close();
  });
  atlas.addEventListener('close', () => {
    document.documentElement.classList.remove('story-viewer-open');
    if (atlasDestination) {
      const scene = scenes.find(scene => scene.id === atlasDestination)!;
      const heading = scene.querySelector<HTMLElement>('h1, h2')!;
      // Set the scrubbed timeline immediately before moving focus into its scene.
      goTo(scene.id, false);
      if (animated()) {
        const index = scenes.indexOf(scene);
        timeline?.time(chapterTimes[index] + (index ? 0.12 : 0));
        activeScene(index);
      }
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      atlasDestination = null;
    } else atlasOpener?.focus({ preventScroll: true });
  });
  atlasLinks.forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    atlasDestination = link.dataset.atlasChapter!;
    history.replaceState(null, '', `#${atlasDestination}`);
    atlas.close();
  }));
  atlasSearch.addEventListener('input', filterAtlas);
  atlasSearch.addEventListener('keydown', event => {
    const first = atlasLinks.find(link => !link.hidden);
    if (event.key === 'ArrowDown' && first) { event.preventDefault(); first.focus(); }
    if (event.key === 'Enter' && first) { event.preventDefault(); first.click(); }
  });
  const shortcut = atlasTrigger.querySelector('kbd')!;
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) shortcut.textContent = 'Ctrl K';
  document.addEventListener('keydown', event => {
    const typing = event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]');
    const command = (event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k';
    const slash = event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey;
    if (!command && !slash) return;
    if (document.querySelector('dialog[open]') && !atlas.open) return;
    event.preventDefault();
    if (atlas.open && command) atlas.close();
    else if (atlas.open) atlasSearch.focus();
    else if (slash && scenes[currentScene].id === 'stack') tree.focusSearch();
    else openAtlas();
  });

  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  stage.addEventListener('pointermove', event => {
    if (!animated() || !finePointer.matches || currentScene !== 0) return;
    const rect = stage.getBoundingClientRect();
    stage.style.setProperty('--orbit-x', `${(event.clientX - rect.left) / rect.width * 16 - 8}deg`);
    stage.style.setProperty('--orbit-y', `${8 - (event.clientY - rect.top) / rect.height * 16}deg`);
    core?.setPointer((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
  });
  stage.addEventListener('pointerleave', () => {
    stage.style.removeProperty('--orbit-x');
    stage.style.removeProperty('--orbit-y');
    core?.setPointer(0, 0);
  });
  document.addEventListener('visibilitychange', () => { syncCore(); syncLoops(); });
  wide.addEventListener('change', mountCore);
  let scrollFrame = 0;
  const updateDocumentProgress = () => {
    scrollFrame = 0;
    if (animated()) return;
    const anchor = innerHeight * 0.4;
    let index = 0;
    scenes.forEach((scene, i) => { if (scene.getBoundingClientRect().top <= anchor) index = i; });
    if (index !== currentScene) activeScene(index);
    const available = root.offsetHeight - innerHeight;
    const fraction = available > 0 ? Math.min(1, Math.max(0, -root.getBoundingClientRect().top / available)) : 1;
    progress.style.transform = `scaleX(${fraction})`;
  };
  window.addEventListener('scroll', () => {
    if (!animated() && !scrollFrame) scrollFrame = requestAnimationFrame(updateDocumentProgress);
  }, { passive: true });

  root.querySelectorAll<HTMLAnchorElement>('[data-chapter]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const id = link.dataset.chapter!;
      history.replaceState(null, '', `#${id}`);
      goTo(id);
    });
  });
  toggle.addEventListener('click', () => {
    if (!animated()) {
      currentScene = scenes.reduce((closest, scene, index) => {
        const centerDistance = (element: HTMLElement) => Math.abs(element.getBoundingClientRect().top + element.offsetHeight / 2 - innerHeight / 2);
        return centerDistance(scene) < centerDistance(scenes[closest]) ? index : closest;
      }, 0);
    }
    requestedMotion = !animated();
    preference = requestedMotion ? 'on' : 'off';
    try { localStorage.setItem('portfolio-motion', preference); } catch (error) {
      console.warn('Motion preference could not be saved; the current view still changed.', error);
    }
    const id = scenes[currentScene].id;
    setup();
    requestAnimationFrame(() => goTo(id, false));
  });
  reduced.addEventListener('change', () => {
    requestedMotion = !reduced.matches && preference !== 'off';
    setup();
  });
  short.addEventListener('change', setup);
  compact.addEventListener('change', () => {
    const id = scenes[currentScene].id;
    setup();
    requestAnimationFrame(() => goTo(id, false));
  });

  galleries.forEach(({ id, viewport: gallery, track, start: galleryStart, end: galleryEnd, distance }) => {
    let dragStart: { x: number; progress: number } | null = null;
    let dragged = false;
    // The timeline speaks each time another milestone takes the lead: the travel is split evenly across the stops, so one
    // arrow press is exactly one step, and each step sits one note higher than the last.
    const stops = track.querySelectorAll('[data-horizontal-item]').length;
    const leadingStop = () => {
      const offset = animated() ? -Number(gsap.getProperty(track, 'x')) : gallery.scrollLeft;
      return Math.round(gsap.utils.clamp(0, 1, offset / Math.max(1, distance())) * (stops - 1));
    };
    let lastStop = leadingStop();
    const watchStop = () => {
      const index = leadingStop();
      if (index === lastStop) return;
      lastStop = index;
      if (gestured) sfx.play('timeline-step', { rate: STEP_RATE[Math.min(index, STEP_RATE.length - 1)] });
    };
    stopWatchers.push(watchStop);
    gallery.addEventListener('scroll', () => { if (!animated()) requestAnimationFrame(watchStop); }, { passive: true });
    const moveGallery = (direction: number) => {
      const pieces = Array.from(track.querySelectorAll<HTMLElement>('[data-horizontal-item]'));
      if (!animated()) {
        gallery.scrollBy({ left: direction * (pieces[0].offsetWidth + 30), behavior: 'instant' });
        return;
      }
      const fraction = gsap.utils.clamp(0, 1, ((timeline?.time() ?? galleryStart) - galleryStart) / (galleryEnd - galleryStart));
      const next = gsap.utils.clamp(0, 1, fraction + direction / Math.max(1, pieces.length - 1));
      scrollForTime(galleryStart + next * (galleryEnd - galleryStart), true);
    };
    root.querySelector(`[data-horizontal-prev="${id}"]`)?.addEventListener('click', () => moveGallery(-1));
    root.querySelector(`[data-horizontal-next="${id}"]`)?.addEventListener('click', () => moveGallery(1));
    gallery.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      moveGallery(event.key === 'ArrowRight' ? 1 : -1);
    });
    gallery.addEventListener('pointerdown', event => {
      if (!animated() || event.button !== 0) return;
      dragStart = { x: event.clientX, progress: gsap.utils.clamp(0, 1, ((timeline?.time() ?? galleryStart) - galleryStart) / (galleryEnd - galleryStart)) };
      dragged = false;
    });
    gallery.addEventListener('dragstart', event => { if (animated()) event.preventDefault(); });
    gallery.addEventListener('pointermove', event => {
      if (!dragStart) return;
      const delta = event.clientX - dragStart.x;
      if (Math.abs(delta) < 8 && !dragged) return;
      dragged = true;
      if (!gallery.hasPointerCapture(event.pointerId)) gallery.setPointerCapture(event.pointerId);
      const value = gsap.utils.clamp(0, 1, dragStart.progress - delta / Math.max(1, distance()));
      scrollForTime(galleryStart + value * (galleryEnd - galleryStart));
    });
    const endDrag = () => {
      if (dragged) blockClickUntil = performance.now() + 300;
      dragStart = null;
    };
    gallery.addEventListener('pointerup', endDrag);
    gallery.addEventListener('pointercancel', endDrag);
    gallery.addEventListener('pointerleave', event => { if (!gallery.hasPointerCapture(event.pointerId)) endDrag(); });
    track.addEventListener('focusin', event => {
      if (!animated() || !(event.target instanceof HTMLElement)) return;
      const piece = event.target.closest<HTMLElement>('[data-horizontal-item]');
      if (!piece) return;
      gallery.scrollLeft = 0;
      const left = piece.offsetLeft + Number(gsap.getProperty(track, 'x'));
      if (left >= -1 && left + piece.offsetWidth <= gallery.clientWidth + 1) return;
      const fraction = gsap.utils.clamp(0, 1, piece.offsetLeft / Math.max(1, distance()));
      scrollForTime(galleryStart + fraction * (galleryEnd - galleryStart));
    });
  });

  const filters = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-story-filter]'));
  const groups = Array.from(document.querySelectorAll<HTMLElement>('[data-story-category]'));
  const stackQuery = document.querySelector<HTMLInputElement>('[data-stack-query]')!;
  let stackCategory = 'all';
  const filterStack = (category = stackCategory) => {
    stackCategory = category;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.storyFilter === category)));
    const words = stackQuery.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let total = 0;
    groups.forEach(group => {
      let shown = 0;
      group.querySelectorAll('li').forEach(item => {
        const terms = `${item.textContent} ${group.dataset.storyCategory}`.toLowerCase();
        item.hidden = !words.every(word => terms.includes(word));
        if (!item.hidden) shown++;
      });
      group.hidden = (category !== 'all' && group.dataset.storyCategory !== category) || shown === 0;
      if (!group.hidden) total += shown;
    });
    document.querySelector<HTMLElement>('[data-stack-total]')!.textContent = `${total} tools & practices`;
    document.querySelector<HTMLElement>('[data-stack-empty]')!.hidden = total !== 0;
  };
  filters.forEach(button => button.addEventListener('click', () => filterStack(button.dataset.storyFilter!)));
  stackQuery.addEventListener('input', () => filterStack('all'));
  filterStack('all');

  const bpViewer = document.querySelector<HTMLDialogElement>('[data-bp-viewer]')!;
  const bpSlot = bpViewer.querySelector<HTMLElement>('[data-bp-slot]')!;
  const bpPanels = Array.from(root.querySelectorAll<HTMLElement>('[data-bp-panel]'));
  const bpTiles = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-blueprint]'));
  const bpHome = root.querySelector<HTMLElement>('[data-bp-panels]')!;
  let bpCurrent = -1;
  let bpOpener: HTMLElement | null = null;
  // Each panel keeps its own step and moves a packet along the edge into the current hop.
  const bpSteps = bpPanels.map(panel => {
    const canvas = panel.querySelector<HTMLElement>('.bp-canvas')!;
    const svg = canvas.querySelector<SVGSVGElement>('svg')!;
    const hops = canvas.dataset.hops!.split(' ');
    const texts = Array.from(panel.querySelectorAll<HTMLElement>('.bp-steps li')).map(li => li.textContent!);
    const count = panel.querySelector<HTMLElement>('[data-bp-step-count]')!;
    const text = panel.querySelector<HTMLElement>('[data-bp-step-text]')!;
    const [back, next] = Array.from(panel.querySelectorAll<HTMLButtonElement>('[data-bp-step]'));
    const nodes = Array.from(svg.querySelectorAll<SVGGElement>('[data-node]'));
    const edges = Array.from(svg.querySelectorAll<SVGPathElement>('.bp-edge'));
    let step = 0;
    let packet: SVGCircleElement | null = null;
    let frame = 0;
    const travel = (edge: SVGPathElement, reverse: boolean) => {
      cancelAnimationFrame(frame);
      packet ??= svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
      packet.setAttribute('class', 'bp-packet');
      packet.setAttribute('r', '5');
      const length = edge.getTotalLength();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 360);
        const eased = 1 - Math.pow(1 - t, 3);
        const point = edge.getPointAtLength(length * (reverse ? 1 - eased : eased));
        packet!.setAttribute('cx', String(point.x));
        packet!.setAttribute('cy', String(point.y));
        packet!.style.opacity = t < 1 ? '1' : '0';
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const show = (index: number, move = false) => {
      const previous = step;
      step = Math.max(0, Math.min(hops.length - 1, index));
      const lit = new Set(hops.slice(0, step + 1));
      nodes.forEach(node => {
        const id = node.dataset.node!;
        node.classList.toggle('is-cur', id === hops[step]);
        node.classList.toggle('is-lit', lit.has(id) && id !== hops[step]);
        node.classList.toggle('is-dim', !lit.has(id));
      });
      edges.forEach(edge => {
        const on = lit.has(edge.dataset.from!) && lit.has(edge.dataset.to!);
        edge.classList.toggle('is-lit', on);
        edge.classList.toggle('is-dim', !on);
      });
      count.textContent = `Step ${step + 1} of ${hops.length}`;
      text.textContent = texts[step];
      back.disabled = step === 0;
      next.disabled = step === hops.length - 1;
      if (move && step !== previous && animated()) {
        const [a, b] = [hops[previous], hops[step]];
        const edge = edges.find(e => (e.dataset.from === a && e.dataset.to === b) || (e.dataset.from === b && e.dataset.to === a));
        if (edge) travel(edge, edge.dataset.from === b);
      }
    };
    back.addEventListener('click', () => show(step - 1, true));
    next.addEventListener('click', () => show(step + 1, true));
    return { panel, show, edges, reset: () => { cancelAnimationFrame(frame); if (packet) packet.style.opacity = '0'; show(0); } };
  });
  bpSteps.forEach(entry => entry.show(0));
  const bpPlace = (index: number) => {
    if (bpCurrent >= 0) bpHome.appendChild(bpPanels[bpCurrent]);
    bpCurrent = (index + bpPanels.length) % bpPanels.length;
    const entry = bpSteps[bpCurrent];
    entry.reset();
    bpSlot.replaceChildren(entry.panel);
    bpSlot.scrollTop = 0;
    bpViewer.setAttribute('aria-labelledby', `bp-title-${entry.panel.dataset.bpPanel}`);
    bpViewer.removeAttribute('aria-label');
    if (animated()) {
      entry.edges.forEach((edge, i) => {
        const length = edge.getTotalLength();
        edge.animate([{ strokeDasharray: `${length}`, strokeDashoffset: length }, { strokeDasharray: `${length}`, strokeDashoffset: 0 }],
          { duration: 500, delay: 120 + i * 30, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      });
    }
  };
  const bpOpen = (index: number, tile?: HTMLElement) => {
    if (document.querySelector('dialog[open]')) return;
    bpOpener = tile ?? null;
    bpPlace(index);
    bpViewer.showModal();
    loopsOpen = true;
    syncLoops();
    document.documentElement.classList.add('story-viewer-open');
    if (sfx.wouldPlay('card-open')) sfx.play('card-open');
    if (tile && animated()) {
      const from = tile.getBoundingClientRect();
      const to = bpViewer.getBoundingClientRect();
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      bpViewer.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`, opacity: .4 },
        { transform: 'none', opacity: 1 },
      ], { duration: 420, easing: 'cubic-bezier(.65,0,.35,1)' });
    }
    bpSteps[bpCurrent].panel.querySelector<HTMLButtonElement>('[data-bp-step="1"]')!.focus({ preventScroll: true });
  };
  bpTiles.forEach((tile, index) => tile.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (performance.now() < blockClickUntil) return;
    bpOpen(index, tile);
  }));
  bpViewer.querySelector('[data-bp-close]')!.addEventListener('click', () => bpViewer.close());
  bpViewer.querySelectorAll<HTMLButtonElement>('[data-bp-move]').forEach(button => button.addEventListener('click', () => bpPlace(bpCurrent + Number(button.dataset.bpMove))));
  bpViewer.addEventListener('click', event => { if (event.target === bpViewer) bpViewer.close(); });
  bpViewer.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    bpPlace(bpCurrent + (event.key === 'ArrowRight' ? 1 : -1));
  });
  bpViewer.addEventListener('close', () => {
    loopsOpen = false;
    syncLoops();
    document.documentElement.classList.remove('story-viewer-open');
    if (bpCurrent >= 0) bpHome.appendChild(bpPanels[bpCurrent]);
    bpOpener?.focus({ preventScroll: true });
    bpCurrent = -1;
    if (location.hash.startsWith('#blueprint-')) history.replaceState(null, '', location.pathname + location.search);
  });

  let opener: HTMLElement | null = null;
  document.querySelectorAll<HTMLAnchorElement>('[data-project], [data-study], [data-detail]').forEach(link => {
    link.addEventListener('click', event => {
      if (performance.now() < blockClickUntil) { event.preventDefault(); return; }
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const dialog = document.getElementById(`detail-${link.dataset.project ?? link.dataset.study ?? link.dataset.detail}`);
      if (!(dialog instanceof HTMLDialogElement)) return;
      event.preventDefault();
      opener = link;
      const iframe = dialog.querySelector<HTMLIFrameElement>('iframe[data-study-src]');
      if (iframe && !iframe.hasAttribute('src')) iframe.src = iframe.dataset.studySrc!;
      dialog.showModal();
      document.documentElement.classList.add('story-viewer-open');
      dialog.querySelector<HTMLElement>('[data-viewer-close]')?.focus();
    });
  });
  // Registered after the viewer opener, so the search field takes focus from the close button.
  root.querySelectorAll<HTMLAnchorElement>('[data-detail="stack"]').forEach(link => {
    link.addEventListener('click', event => {
      if (!event.defaultPrevented) return;
      stackQuery.value = '';
      filterStack(link.dataset.stackFilter ?? 'all');
      if (link.hasAttribute('data-stack-search-open')) stackQuery.focus();
    });
  });
  document.querySelectorAll<HTMLDialogElement>('.project-viewer').forEach(dialog => {
    dialog.querySelector('[data-viewer-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('story-viewer-open');
      opener?.focus({ preventScroll: true });
    });
  });
  const followHash = () => {
    const blueprint = bpTiles.findIndex(tile => tile.hash === location.hash);
    if (blueprint >= 0) {
      goTo('systems', false);
      if (!bpViewer.open) bpOpen(blueprint, bpTiles[blueprint]);
      return;
    }
    const detailLink = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-detail]')).find(link => link.hash === location.hash);
    if (detailLink) {
      const scene = detailLink.closest<HTMLElement>('[data-scene]');
      if (scene) goTo(scene.id, false);
      const dialog = document.getElementById(`detail-${detailLink.dataset.detail}`);
      if (dialog instanceof HTMLDialogElement && !dialog.open) detailLink.click();
    } else goTo(location.hash.slice(1));
  };
  window.addEventListener('hashchange', followHash);
  setup();
  requestAnimationFrame(() => {
    if (location.hash) followHash();
    updateDocumentProgress();
  });
}
