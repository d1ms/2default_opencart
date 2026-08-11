/*
 * 2default theme interactivity. Loaded after common.js, so `cart`,
 * `wishlist`, `compare` (defined there) are available as globals — this
 * file does not duplicate their AJAX logic, it only adds the UI chrome
 * common.js's stock markup didn't need: overlay open/close (search modal,
 * cart drawer accessibility), the PDP gallery swap, and the quantity
 * stepper.
 */
(function ($) {
	'use strict';

	/* ---------- Generic overlay (search modal today; reusable later) ---------- */

	function openOverlay($overlay) {
		$overlay.addClass('is-open').attr('aria-hidden', 'false');
		$('body').addClass('site-overlay-open');
		var $autofocus = $overlay.find('input[type="text"]').first();
		if ($autofocus.length) {
			setTimeout(function () { $autofocus.trigger('focus'); }, 50);
		}
	}

	function closeOverlay($overlay) {
		$overlay.removeClass('is-open').attr('aria-hidden', 'true');
		if (!$('.site-overlay.is-open').length) {
			$('body').removeClass('site-overlay-open');
		}
	}

	$(document).on('click', '#search-open', function () {
		openOverlay($('#search-modal'));
	});

	$(document).on('click', '[data-close-overlay]', function () {
		closeOverlay($('#' + $(this).data('close-overlay')));
	});

	// Click on the dark backdrop (not the panel itself) closes the overlay.
	$(document).on('click', '.site-overlay', function (e) {
		if (e.target === this) {
			closeOverlay($(this));
		}
	});

	$(document).on('keydown', function (e) {
		if (e.key === 'Escape' || e.keyCode === 27) {
			$('.site-overlay.is-open').each(function () {
				closeOverlay($(this));
			});
			// Cart drawer: reuse Bootstrap's own close path so its
			// internal state (the click-outside handler it registers)
			// stays in sync.
			if ($('#cart').hasClass('open')) {
				$('#cart > button').trigger('click');
			}
			closeMobileMenu();
		}
	});

	// Bootstrap's dropdown.js only closes on outside click; add body scroll
	// lock + backdrop visibility + the drawer's slide-in while the cart is
	// open. Driven with inline styles rather than a "#cart.open ..." CSS
	// selector, and with `right` rather than `transform`, since both a
	// class-based selector and a transform-based slide were unreliable to
	// verify in automated checks — inline `right` is unambiguous. Deferred
	// to DOMReady because theme.js loads in <head>, before #cart exists.
	$(function () {
		var cartEl = document.getElementById('cart');
		if (!window.MutationObserver || !cartEl) {
			return;
		}
		var $backdrop = $('#cart-drawer-backdrop');

		function syncCartState() {
			var isOpen = $('#cart').hasClass('open');
			// Re-query every time — common.js's .load() can replace children,
			// but the <ul> element itself persists; re-querying is cheap
			// insurance against edge-case reference staleness.
			var $drawer = $('#cart .cart-drawer-list');
			$('body').toggleClass('site-overlay-open', isOpen);
			// `right` (a layout property) rather than a transform — kept
			// deliberately simple and universally unambiguous.
			$drawer.css('right', isOpen ? '0' : '-30rem');
			$backdrop.css({
				opacity: isOpen ? 1 : 0,
				pointerEvents: isOpen ? 'auto' : 'none'
			});
		}

		var observer = new MutationObserver(syncCartState);
		observer.observe(cartEl, { attributes: true, attributeFilter: ['class'] });
		syncCartState();

		// Clicking the backdrop should close the cart drawer by re-using
		// Bootstrap's own toggle path (keeps its internal state in sync).
		$backdrop.on('click', function () {
			if ($('#cart').hasClass('open')) {
				$('#cart > button').dropdown('toggle');
			}
		});

		// After any AJAX call that reloads cart content (cart.add/update/remove
		// all call $('#cart > ul').load(…)), re-sync to ensure the drawer
		// position is still correct.
		$(document).on('ajaxComplete', function () {
			setTimeout(syncCartState, 150);
		});
	});

	/* ---------- Toast notifications (replaces Bootstrap .alert-dismissible) ---------- */
	/*
	 * common.js's cart/wishlist/compare success handlers, and this theme's
	 * own inline scripts (product review submit, option-validation errors),
	 * all inject a Bootstrap ".alert alert-{success,danger,warning,info}
	 * alert-dismissible" banner above the page content. Rather than editing
	 * every call site (common.js is shared/vendored; product.twig has
	 * several inline scripts), intercept those insertions in one place and
	 * reroute the same message into a toast instead: once on DOMReady for
	 * anything server-rendered into the initial page (login/register
	 * errors, a post-redirect "item added" message), and on every
	 * ajaxComplete for anything injected by an AJAX success/error handler.
	 * ".alert-info" banners are left alone — those are persistent page
	 * context (e.g. "minimum quantity is X"), not a one-time action result.
	 */
	var TOAST_ICON = { success: 'check-circle', danger: 'alert-circle', warning: 'triangle-alert', info: 'info' };
	var TOAST_DURATION = { success: 3500, danger: 5500, warning: 5000, info: 3500 };

	function showToast(message, type) {
		var $container = $('#toast-container');
		if (!$container.length || !message) {
			return;
		}
		type = TOAST_ICON[type] ? type : 'info';

		var $toast = $(
			'<div class="toast toast-' + type + '" role="' + (type === 'danger' ? 'alert' : 'status') + '" aria-live="' + (type === 'danger' ? 'assertive' : 'polite') + '">' +
				'<svg class="toast-icon w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#icon-' + TOAST_ICON[type] + '"></use></svg>' +
				'<span class="toast-message"></span>' +
				'<button type="button" class="toast-close" aria-label="Close">' +
					'<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#icon-x"></use></svg>' +
				'</button>' +
			'</div>'
		);
		// OpenCart's success/error strings (e.g. text_success) routinely
		// embed real <a> links — flatten to plain text rather than treating
		// message as either trusted HTML (XSS risk: some of these strings
		// interpolate user input) or literal text (the tags would render
		// as visible text). Matches toastFromAlert()'s existing behavior
		// for the AJAX/DOMReady-intercepted alerts.
		$toast.find('.toast-message').text($('<div>').html(message).text());
		$container.append($toast);

		// A short setTimeout (not requestAnimationFrame) commits the
		// initial state before the class toggle so the enter transition
		// actually plays — rAF is throttled/suspended entirely on a
		// backgrounded/hidden tab (as CSS transitions were found to be
		// elsewhere in this project), which setTimeout is not.
		setTimeout(function () { $toast.addClass('is-visible'); }, 20);

		var duration = TOAST_DURATION[type];
		var dismissTimer = setTimeout(dismiss, duration);

		function dismiss() {
			clearTimeout(dismissTimer);
			$toast.removeClass('is-visible').addClass('is-leaving');
			setTimeout(function () { $toast.remove(); }, 200);
		}

		$toast.on('mouseenter', function () { clearTimeout(dismissTimer); });
		$toast.on('mouseleave', function () { dismissTimer = setTimeout(dismiss, duration); });
		$toast.find('.toast-close').on('click', dismiss);
	}
	// Exposed globally so inline <script> blocks in individual templates
	// (e.g. product.twig's own hand-rolled add-to-cart handler, which
	// doesn't go through common.js's shared cart.add()) can raise a toast
	// directly instead of building their own alert markup for sweepAlerts()
	// to intercept.
	window.showToast = showToast;

	// Pull the plain-text message out of a Bootstrap alert div, ignoring its
	// icon (<i> or inline <svg>) and close button, then remove the div —
	// the toast replaces it, it shouldn't also linger inline.
	function toastFromAlert($alert) {
		var type = $alert.hasClass('alert-success') ? 'success'
			: $alert.hasClass('alert-danger') ? 'danger'
			: $alert.hasClass('alert-warning') ? 'warning'
			: null;
		if (!type) {
			return;
		}
		var $clone = $alert.clone();
		$clone.find('svg, i, .close').remove();
		var message = $clone.text().replace(/\s+/g, ' ').trim();
		$alert.remove();
		showToast(message, type);
	}

	function sweepAlerts() {
		// Checkout's multi-step accordion prepends its per-section errors
		// (address/shipping/payment) directly inside that step's own
		// .panel-body — deliberately inline, next to the field it's about.
		// Leave those alone; only reroute the page-top/content-top banners
		// (login, register, cart/wishlist/compare, reviews, etc.) to a
		// toast, per the "show errors near the field" guideline.
		$('.alert-success, .alert-danger, .alert-warning').each(function () {
			if ($(this).closest('.panel-body, .panel').length) {
				return;
			}
			toastFromAlert($(this));
		});
	}
	$(function () { sweepAlerts(); });
	$(document).on('ajaxComplete', sweepAlerts);

	/* ---------- Patch Font Awesome markup that common.js injects ---------- */
	/*
	 * common.js's cart/wishlist/compare success handlers and the cart pill
	 * refresh all hardcode Font Awesome <i> markup. This project doesn't
	 * use Font Awesome for its own icons (SVG sprite instead), so sweep the
	 * DOM after every AJAX call and swap any Font Awesome icon it injected
	 * for the matching sprite icon.
	 */
	var FA_TO_SVG = {
		'fa-shopping-cart': 'shopping-bag',
		'fa-check-circle': 'check-circle',
		'fa-exclamation-circle': 'alert-circle',
		'fa-times-circle': 'x-circle',
		'fa-heart': 'heart'
	};
	function patchFontAwesomeIcons() {
		Object.keys(FA_TO_SVG).forEach(function (faClass) {
			$('i.fa.' + faClass).each(function () {
				$(this).replaceWith('<svg class="w-4 h-4 shrink-0 inline" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#icon-' + FA_TO_SVG[faClass] + '"></use></svg>');
			});
		});
	}
	$(document).on('ajaxComplete', patchFontAwesomeIcons);

	/* ---------- Rebuild the header cart button after common.js's AJAX overwrite ---------- */
	/*
	 * common.js's cart.add/update/remove success handlers all replace
	 * #cart > button's innerHTML with a hardcoded
	 * '<span id="cart-total"><i class="fa fa-shopping-cart"></i> TEXT</span>'
	 * — via their OWN setTimeout(..., 100), i.e. *after* ajaxComplete fires,
	 * not before. Rebuild the button back to the icon+badge markup here,
	 * pulling the item count out of that text (it's always the first number
	 * — see language/en-gb/common/cart.php's "%s item(s) - %s"), delayed
	 * past common.js's own timeout so this doesn't get clobbered by it.
	 */
	function syncCartButton() {
		var $btn = $('#cart > button');
		var $totalSpan = $btn.find('#cart-total');
		if (!$totalSpan.length) {
			return;
		}
		var match = $totalSpan.text().match(/\d+/);
		var count = match ? parseInt(match[0], 10) : 0;
		$btn.html(
			'<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#icon-shopping-bag"></use></svg>' +
			'<span id="cart-total" class="cart-badge' + (count === 0 ? ' is-hidden' : '') + '">' + count + '</span>'
		);
	}

	function syncWishlistButton() {
		var $btn = $('#wishlist-total');
		if (!$btn.length) {
			return;
		}
		var text = $btn.text() || $btn.attr('title') || '';
		var match = text.match(/\d+/);
		var count = match ? parseInt(match[0], 10) : 0;
		$btn.html(
			'<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#icon-heart"></use></svg>' +
			'<span class="wishlist-badge' + (count === 0 ? ' is-hidden' : '') + '">' + count + '</span>'
		);
	}

	$(document).on('ajaxComplete', function () {
		setTimeout(syncCartButton, 150);
		setTimeout(syncWishlistButton, 150);
	});

	/* ---------- Category nav overflow ("...") ---------- */
	/*
	 * The category bar has no fixed item count — however many top-level
	 * categories the store has must fit between the logo and the header
	 * icons. Items that don't fit are hidden and relisted under a "..."
	 * trigger instead of wrapping/overflowing. Visibility is toggled with
	 * inline styles rather than a class, for the same cascade-safety
	 * reason noted in menu.twig.
	 */
	function layoutNav() {
		var navEl = document.getElementById('site-nav');
		var headerRow = document.getElementById('header-row');
		if (!navEl || !headerRow) {
			return;
		}
		var $nav = $(navEl);
		var $more = $('#nav-more');
		var $panel = $('#nav-more-panel');
		var $items = $nav.find('.nav-item[data-name]');

		// Reset to the "everything fits" state before re-measuring.
		$items.each(function () { this.style.display = ''; });
		$panel.empty();
		$more[0].style.display = 'none';

		// navEl.clientWidth is not usable here: #site-nav is the only
		// shrinkable child in the header row (logo and #header-actions are
		// both shrink-0), so its rendered box is only a true "available
		// space" measurement while everything still fits. The moment its
		// content (shrink-0 .nav-item's) needs more room than is left,
		// flex-shrink bottoms out at that content's own min-content width
		// instead — meaning clientWidth starts reporting *content* width,
		// not *available* width, and even flips depending on whether
		// #nav-more itself is currently shown. Compute the true budget
		// directly from the two siblings that actually have a fixed size
		// instead, sidestepping that feedback loop entirely.
		var logoEl = headerRow.querySelector(':scope > a');
		var actionsEl = document.getElementById('header-actions');
		var rowGap = parseFloat(getComputedStyle(headerRow).columnGap) || 0;
		var available = headerRow.clientWidth
			- (logoEl ? $(logoEl).outerWidth(true) : 0)
			- (actionsEl ? $(actionsEl).outerWidth(true) : 0)
			- rowGap * 2;

		// navEl.scrollWidth is not usable here either: each item with
		// children contains an absolutely-positioned dropdown flyout that
		// stays in the layout (visibility: hidden, not display: none) so it
		// can transition in on hover — those flyouts inflate scrollWidth
		// even though nothing is visibly overflowing. Sum actual item
		// widths (+ the flex gap between them) instead.
		var gap = parseFloat(getComputedStyle(navEl).columnGap) || 0;
		var widths = [];
		$items.each(function () { widths.push($(this).outerWidth(true)); });
		var total = widths.reduce(function (a, b) { return a + b; }, 0) + gap * Math.max(0, widths.length - 1);

		if (total <= available) {
			return;
		}

		$more[0].style.display = 'flex';
		var budget = available - ($more.outerWidth(true) + gap);

		var used = 0;
		var overflowed = [];
		$items.each(function (i) {
			var w = widths[i] + (i > 0 ? gap : 0);
			if (used + w > budget) {
				overflowed.push(this);
			} else {
				used += w;
			}
		});

		if (!overflowed.length) {
			$more[0].style.display = 'none';
			return;
		}

		overflowed.forEach(function (el) {
			el.style.display = 'none';
			var $li = $('<li role="none">');
			var $a = $('<a role="menuitem">')
				.attr('href', el.getAttribute('data-href'))
				.text(el.getAttribute('data-name'));
			$li.append($a);
			$panel.append($li);
		});
	}

	/* ---------- Category nav active state ---------- */
	/*
	 * OpenCart's menu controller doesn't flag which category is "current"
	 * in the data it hands to the template, so the active link is derived
	 * client-side by comparing each nav link's resolved href against the
	 * current URL. Covers the desktop bar (including items relisted under
	 * "..." by layoutNav), and the mobile panel. Re-run after layoutNav
	 * since it rebuilds #nav-more-panel's links from scratch.
	 */
	function markActiveNav() {
		var here = location.href.split('#')[0];

		$('#site-nav .nav-item[data-href]').each(function () {
			var $item = $(this);
			var active = $item.attr('data-href') === here;
			if (!active) {
				$item.find('a[href]').each(function () {
					if (this.href.split('#')[0] === here) {
						active = true;
						return false;
					}
				});
			}
			$item.children('a').toggleClass('is-active', active);
		});

		var $moreLinks = $('#nav-more-panel a[href]').toggleClass('is-active', false);
		var moreHasActive = false;
		$moreLinks.each(function () {
			var active = this.href.split('#')[0] === here;
			$(this).toggleClass('is-active', active);
			moreHasActive = moreHasActive || active;
		});
		$('#nav-more > button').toggleClass('is-active', moreHasActive);

		$('#mobile-menu-panel a[href]').each(function () {
			$(this).toggleClass('is-active', this.href.split('#')[0] === here);
		});
	}

	var navResizeTimer = null;
	$(window).on('resize', function () {
		clearTimeout(navResizeTimer);
		navResizeTimer = setTimeout(function () { layoutNav(); markActiveNav(); }, 150);
	});
	$(window).on('load', function () { layoutNav(); markActiveNav(); });
	$(function () { layoutNav(); markActiveNav(); });
	// A run immediately on DOMReady can measure text set in a fallback
	// font (Hanken Grotesk loads async from Google Fonts) and get widths
	// wrong. Re-run once the swap is done, plus one delayed safety pass
	// for anything else that settles late (the icon sprite, etc).
	if (window.document && document.fonts && document.fonts.ready) {
		document.fonts.ready.then(function () { layoutNav(); markActiveNav(); });
	}
	setTimeout(function () { layoutNav(); markActiveNav(); }, 500);

	/* ---------- Mobile category nav toggle ---------- */
	/*
	 * Plain Tailwind `hidden` toggle rather than Bootstrap's collapse
	 * plugin — mixing this theme's unlayered hand-written CSS with
	 * Tailwind's layered, !important-prefixed responsive overrides was
	 * observed to lose to a plain unlayered rule in this build's
	 * cascade-layer output, so the toggle is done with same-system
	 * (Tailwind-only) classes instead.
	 */
	function closeMobileMenu() {
		$('#mobile-menu-panel').addClass('hidden');
		$('#mobile-menu-icon-open').removeClass('hidden');
		$('#mobile-menu-icon-close').addClass('hidden');
		$('#mobile-menu-toggle').attr('aria-expanded', 'false');
		$('#mobile-menu-panel .mobile-submenu').addClass('hidden');
		$('#mobile-menu-panel .mobile-submenu-toggle').attr('aria-expanded', 'false').find('svg').removeClass('rotate-180');
	}

	$(document).on('click', '#mobile-menu-toggle', function (e) {
		e.stopPropagation();
		var $panel = $('#mobile-menu-panel');
		var willOpen = $panel.hasClass('hidden');
		if (willOpen) {
			$panel.removeClass('hidden');
			$('#mobile-menu-icon-open').addClass('hidden');
			$('#mobile-menu-icon-close').removeClass('hidden');
			$(this).attr('aria-expanded', 'true');
		} else {
			closeMobileMenu();
		}
	});

	// Toggle submenus inside mobile menu
	$(document).on('click', '.mobile-submenu-toggle', function (e) {
		e.preventDefault();
		e.stopPropagation();
		var $btn = $(this);
		var $submenu = $btn.closest('.mobile-menu-item').find('.mobile-submenu').first();
		var $icon = $btn.find('svg');
		var isExpanded = $btn.attr('aria-expanded') === 'true';

		if (isExpanded) {
			$submenu.addClass('hidden');
			$btn.attr('aria-expanded', 'false');
			$icon.removeClass('rotate-180');
		} else {
			$submenu.removeClass('hidden');
			$btn.attr('aria-expanded', 'true');
			$icon.addClass('rotate-180');
		}
	});

	// Close the mobile panel when a link inside it, or anywhere outside
	// it, is clicked.
	$(document).on('click', '#mobile-menu-panel a', closeMobileMenu);
	$(document).on('click', function (e) {
		var $panel = $('#mobile-menu-panel');
		if ($panel.length && !$panel.hasClass('hidden') && !$(e.target).closest('#mobile-menu-panel, #mobile-menu-toggle').length) {
			closeMobileMenu();
		}
	});

	/* ---------- PDP: floating thumbnail strip swaps the main image ---------- */

	$(document).on('click', '.product-gallery-thumb', function () {
		var $btn = $(this);
		var full = $btn.data('full');
		var zoom = $btn.data('zoom');

		$('#product-main-image').attr('src', full);
		$('#product-main-image').closest('a.thumbnail').attr('href', zoom);

		// Remove active state from all thumbnails
		$('.product-gallery-thumb')
			.removeClass('is-active scale-105 border-2 border-primary shadow-xs')
			.addClass('border border-black/10 hover:border-black/30');

		// Add active state to clicked thumbnail
		$btn
			.addClass('is-active scale-105 border-2 border-primary shadow-xs')
			.removeClass('border border-black/10 hover:border-black/30');
	});

	/* ---------- PDP: quantity stepper ---------- */

	$(document).on('click', '#quantity-increase', function () {
		var $input = $('#input-quantity');
		var value = parseInt($input.val(), 10) || 1;
		$input.val(value + 1).trigger('change');
	});

	$(document).on('click', '#quantity-decrease', function () {
		var $input = $('#input-quantity');
		var value = parseInt($input.val(), 10) || 1;
		$input.val(Math.max(1, value - 1)).trigger('change');
	});

	/* ---------- Hero module: mouse-driven background parallax (no WebGL) ----------
	   Deliberately vanilla (no jQuery, no third-party lib — this theme has no
	   JS bundler, see components.css's hero comment). Per hero section
	   (.hero-parallax, one per Design > Hero Containers module instance —
	   there can be several on one page) tracks the pointer position relative
	   to *that* section's own bounds via getBoundingClientRect(), not a
	   single window-wide mouse position, since sections can sit anywhere on
	   the page at any size. Values are lerped toward the target each frame
	   (a single shared requestAnimationFrame loop for every instance) and
	   written as a CSS custom property on the section root; the actual
	   transform lives in components.css's .hero-parallax__media rule, which
	   just reads that inherited property — this function never touches
	   .style.transform directly. Only the background media moves; the text
	   / buttons block (.hero-parallax__content) is intentionally left alone
	   so copy never shifts or tilts under the cursor.
	   Deferred to DOMReady because theme.js loads in <head>, before any
	   .hero-parallax section exists (same reason as the cart drawer wiring
	   above) — querying at top-level IIFE time would always find zero. */
	$(function () {
		var sections = document.querySelectorAll('.hero-parallax');

		if (!sections.length) {
			return;
		}

		var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduceMotion) {
			return;
		}

		var items = [];
		var REST_EPSILON = 0.001;

		sections.forEach(function (section) {
			var state = {
				el: section,
				targetX: 0,
				targetY: 0,
				curX: 0,
				curY: 0,
				hovering: false,
				active: !('IntersectionObserver' in window)
			};

			function updatePosition(clientX, clientY) {
				var rect = section.getBoundingClientRect();
				state.targetX = ((clientX - rect.left) / rect.width - 0.5) * 2;
				state.targetY = ((clientY - rect.top) / rect.height - 0.5) * 2;
			}

			// Mouse pointer events (PC)
			section.addEventListener('mouseenter', function () {
				state.hovering = true;
			});

			section.addEventListener('mousemove', function (e) {
				updatePosition(e.clientX, e.clientY);
			});

			section.addEventListener('mouseleave', function () {
				state.hovering = false;
				state.targetX = 0;
				state.targetY = 0;
			});

			// Touch pointer events (Mobile devices)
			section.addEventListener('touchstart', function (e) {
				state.hovering = true;
				if (e.touches && e.touches[0]) {
					updatePosition(e.touches[0].clientX, e.touches[0].clientY);
				}
			}, { passive: true });

			section.addEventListener('touchmove', function (e) {
				if (e.touches && e.touches[0]) {
					updatePosition(e.touches[0].clientX, e.touches[0].clientY);
				}
			}, { passive: true });

			section.addEventListener('touchend', function () {
				state.hovering = false;
				state.targetX = 0;
				state.targetY = 0;
			});

			section.addEventListener('touchcancel', function () {
				state.hovering = false;
				state.targetX = 0;
				state.targetY = 0;
			});

			if ('IntersectionObserver' in window) {
				new IntersectionObserver(function (entries) {
					state.active = entries[0].isIntersecting;
				}, { threshold: 0 }).observe(section);
			}

			items.push(state);
		});

		function tick() {
			requestAnimationFrame(tick);

			if (document.hidden) {
				return;
			}

			items.forEach(function (state) {
				if (!state.active) {
					return;
				}

				if (!state.hovering && Math.abs(state.curX) < REST_EPSILON && Math.abs(state.curY) < REST_EPSILON) {
					return;
				}

				state.curX += (state.targetX - state.curX) * 0.06;
				state.curY += (state.targetY - state.curY) * 0.06;

				if (!state.hovering && Math.abs(state.curX) < REST_EPSILON && Math.abs(state.curY) < REST_EPSILON) {
					state.curX = 0;
					state.curY = 0;
				}

				state.el.style.setProperty('--hero-shift-x', (-state.curX * 16).toFixed(2) + 'px');
				state.el.style.setProperty('--hero-shift-y', (-state.curY * 12).toFixed(2) + 'px');
			});
		}

		tick();
	});

	/* ---------- Password show/hide toggle (login, register, password forms) ---------- */
	/*
	  Delegated so any .form-control-toggle button next to a password field
	  works without per-template JS — toggles the sibling input's type and
	  reflects state via aria-pressed (the icon itself doesn't change since
	  the theme's sprite has no eye-off glyph; the toggle's own pressed/hover
	  color communicates the state instead).
	*/
	$(document).on('click', '.form-control-toggle', function () {
		var $btn = $(this);
		var $input = $btn.siblings('input').first();
		var showing = $input.attr('type') === 'text';

		$input.attr('type', showing ? 'password' : 'text');
		$btn.attr('aria-pressed', showing ? 'false' : 'true');
	});

})(window.jQuery);
