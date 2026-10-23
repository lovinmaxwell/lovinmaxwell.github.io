import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { storyChapters, storyDuration as duration, galleryTimings } from '../data/story';
import type { NeuralCore } from './neural-core';

const chapterTimes = storyChapters.map(chapter => chapter.at);

export function initStory() {
  const root = document.querySelector<HTMLElement>('[data-story]');
  if (!root) return;
  const stage = root.querySelector<HTMLElement>('.story-stage')!;
  const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-scene]'));
  const toggle = root.querySelector<HTMLButtonElement>('[data-motion-toggle]')!;
  const toggleLabel = root.querySelector<HTMLElement>('[data-motion-label]')!;
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
  let currentScene = 0;
  let blockClickUntil = 0;
  const animated = () => root.dataset.motion === 'on';
  // The WebGL core is an enhancement over the poster: wide screens with motion on only, loaded after the page settles.
  const coreHost = root.querySelector<HTMLElement>('[data-core-model]');
  const wide = matchMedia('(min-width: 768px)');
  let core: NeuralCore | undefined;
  let coreRequested = false;
  const syncCore = () => core?.setRunning(animated() && currentScene === 0 && !document.hidden);
  const mountCore = () => {
    if (coreRequested || !coreHost || !animated() || !wide.matches || !('WebGL2RenderingContext' in window)) return;
    coreRequested = true;
    import('./neural-core')
      .then(({ createNeuralCore }) => createNeuralCore(coreHost, coreHost.dataset.coreModel!))
      .then(instance => { core = instance; syncCore(); })
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
  const activeScene = (index: number) => {
    currentScene = index;
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
        .fromTo('.doha-art', { y: 40, opacity: 0.4 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }, 8.55)
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
  document.addEventListener('visibilitychange', syncCore);
  wide.addEventListener('change', mountCore);
  root.querySelectorAll<HTMLElement>('.capability').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (!finePointer.matches) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });
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
  const filterStack = (category: string) => {
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.storyFilter === category)));
    let total = 0;
    groups.forEach(group => {
      group.hidden = category !== 'all' && group.dataset.storyCategory !== category;
      if (!group.hidden) total += group.querySelectorAll('li').length;
    });
    document.querySelector<HTMLElement>('[data-stack-total]')!.textContent = `${total} tools & practices`;
  };
  filters.forEach(button => button.addEventListener('click', () => filterStack(button.dataset.storyFilter!)));
  filterStack('all');

  const systemButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-system-select]'));
  const systemPanels = Array.from(root.querySelectorAll<HTMLElement>('[data-system-panel]'));
  const selectSystem = (id: string) => {
    systemButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.systemSelect === id)));
    systemPanels.forEach(panel => { panel.hidden = panel.dataset.systemPanel !== id; });
  };
  systemButtons.forEach(button => button.addEventListener('click', () => selectSystem(button.dataset.systemSelect!)));
  selectSystem('enterprise');
  systemPanels.forEach(panel => {
    const heading = panel.querySelector<HTMLElement>('[data-system-heading]')!;
    const description = panel.querySelector<HTMLElement>('[data-system-description]')!;
    const originalHeading = heading.textContent;
    const originalDescription = description.textContent;
    const steps = Array.from(panel.querySelectorAll<HTMLButtonElement>('[data-system-step]'));
    const reset = panel.querySelector<HTMLButtonElement>('[data-system-reset]')!;
    const inspectStep = (selected?: HTMLButtonElement) => {
      steps.forEach(button => {
        const active = button === selected;
        button.setAttribute('aria-pressed', String(active));
        button.closest('.flow-node')!.classList.toggle('is-inspected', active);
      });
      heading.textContent = selected ? selected.dataset.stepTitle! : originalHeading;
      description.textContent = selected ? selected.dataset.stepDescription! : originalDescription;
      reset.disabled = !selected;
    };
    steps.forEach((button, index) => {
      button.addEventListener('click', () => inspectStep(button));
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? steps.length - 1 :
          (index + (event.key === 'ArrowRight' ? 1 : -1) + steps.length) % steps.length;
        steps[next].focus({ preventScroll: true });
        inspectStep(steps[next]);
      });
    });
    reset.addEventListener('click', () => inspectStep());
    inspectStep();
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
  document.querySelectorAll<HTMLDialogElement>('.project-viewer').forEach(dialog => {
    dialog.querySelector('[data-viewer-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('story-viewer-open');
      opener?.focus({ preventScroll: true });
    });
  });
  const followHash = () => {
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
