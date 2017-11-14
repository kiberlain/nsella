;
(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }

}(function($) {
    'use strict';
    var Slick = window.Slick || {};

    Slick = (function() {

        var instanceUid = 0;

        function Slick(element, settings) {

            var _ = this,
                dataSettings;

            _.defaults = {
                accessibility: true,
                adaptiveHeight: false,
                appendArrows: $(element),
                appendDots: $(element),
                arrows: true,
                asNavFor: null,
                prevArrow: '<button class="slick-prev" aria-label="Previous" type="button">Previous</button>',
                nextArrow: '<button class="slick-next" aria-label="Next" type="button">Next</button>',
                autoplay: false,
                autoplaySpeed: 3000,
                centerMode: false,
                centerPadding: '50px',
                cssEase: 'ease',
                customPaging: function(slider, i) {
                    return $('<button type="button" />').text(i + 1);
                },
                dots: false,
                dotsClass: 'slick-dots',
                draggable: true,
                easing: 'linear',
                edgeFriction: 0.35,
                fade: false,
                focusOnSelect: false,
                focusOnChange: false,
                infinite: true,
                initialSlide: 0,
                lazyLoad: 'ondemand',
                mobileFirst: false,
                pauseOnHover: true,
                pauseOnFocus: true,
                pauseOnDotsHover: false,
                respondTo: 'window',
                responsive: null,
                rows: 1,
                rtl: false,
                slide: '',
                slidesPerRow: 1,
                slidesToShow: 1,
                slidesToScroll: 1,
                speed: 500,
                swipe: true,
                swipeToSlide: false,
                touchMove: true,
                touchThreshold: 5,
                useCSS: true,
                useTransform: true,
                variableWidth: false,
                vertical: false,
                verticalSwiping: false,
                waitForAnimate: true,
                zIndex: 1000
            };

            _.initials = {
                animating: false,
                dragging: false,
                autoPlayTimer: null,
                currentDirection: 0,
                currentLeft: null,
                currentSlide: 0,
                direction: 1,
                $dots: null,
                listWidth: null,
                listHeight: null,
                loadIndex: 0,
                $nextArrow: null,
                $prevArrow: null,
                scrolling: false,
                slideCount: null,
                slideWidth: null,
                $slideTrack: null,
                $slides: null,
                sliding: false,
                slideOffset: 0,
                swipeLeft: null,
                swiping: false,
                $list: null,
                touchObject: {},
                transformsEnabled: false,
                unslicked: false
            };

            $.extend(_, _.initials);

            _.activeBreakpoint = null;
            _.animType = null;
            _.animProp = null;
            _.breakpoints = [];
            _.breakpointSettings = [];
            _.cssTransitions = false;
            _.focussed = false;
            _.interrupted = false;
            _.hidden = 'hidden';
            _.paused = true;
            _.positionProp = null;
            _.respondTo = null;
            _.rowCount = 1;
            _.shouldClick = true;
            _.$slider = $(element);
            _.$slidesCache = null;
            _.transformType = null;
            _.transitionType = null;
            _.visibilityChange = 'visibilitychange';
            _.windowWidth = 0;
            _.windowTimer = null;

            dataSettings = $(element).data('slick') || {};

            _.options = $.extend({}, _.defaults, settings, dataSettings);

            _.currentSlide = _.options.initialSlide;

            _.originalSettings = _.options;

            if (typeof document.mozHidden !== 'undefined') {
                _.hidden = 'mozHidden';
                _.visibilityChange = 'mozvisibilitychange';
            } else if (typeof document.webkitHidden !== 'undefined') {
                _.hidden = 'webkitHidden';
                _.visibilityChange = 'webkitvisibilitychange';
            }

            _.autoPlay = $.proxy(_.autoPlay, _);
            _.autoPlayClear = $.proxy(_.autoPlayClear, _);
            _.autoPlayIterator = $.proxy(_.autoPlayIterator, _);
            _.changeSlide = $.proxy(_.changeSlide, _);
            _.clickHandler = $.proxy(_.clickHandler, _);
            _.selectHandler = $.proxy(_.selectHandler, _);
            _.setPosition = $.proxy(_.setPosition, _);
            _.swipeHandler = $.proxy(_.swipeHandler, _);
            _.dragHandler = $.proxy(_.dragHandler, _);
            _.keyHandler = $.proxy(_.keyHandler, _);

            _.instanceUid = instanceUid++;

            // A simple way to check for HTML strings
            // Strict HTML recognition (must start with <)
            // Extracted from jQuery v1.11 source
            _.htmlExpr = /^(?:\s*(<[\w\W]+>)[^>]*)$/;


            _.registerBreakpoints();
            _.init(true);

        }

        return Slick;

    }());

    Slick.prototype.activateADA = function() {
        var _ = this;

        _.$slideTrack.find('.slick-active').attr({
            'aria-hidden': 'false'
        }).find('a, input, button, select').attr({
            'tabindex': '0'
        });

    };

    Slick.prototype.addSlide = Slick.prototype.slickAdd = function(markup, index, addBefore) {

        var _ = this;

        if (typeof(index) === 'boolean') {
            addBefore = index;
            index = null;
        } else if (index < 0 || (index >= _.slideCount)) {
            return false;
        }

        _.unload();

        if (typeof(index) === 'number') {
            if (index === 0 && _.$slides.length === 0) {
                $(markup).appendTo(_.$slideTrack);
            } else if (addBefore) {
                $(markup).insertBefore(_.$slides.eq(index));
            } else {
                $(markup).insertAfter(_.$slides.eq(index));
            }
        } else {
            if (addBefore === true) {
                $(markup).prependTo(_.$slideTrack);
            } else {
                $(markup).appendTo(_.$slideTrack);
            }
        }

        _.$slides = _.$slideTrack.children(this.options.slide);

        _.$slideTrack.children(this.options.slide).detach();

        _.$slideTrack.append(_.$slides);

        _.$slides.each(function(index, element) {
            $(element).attr('data-slick-index', index);
        });

        _.$slidesCache = _.$slides;

        _.reinit();

    };

    Slick.prototype.animateHeight = function() {
        var _ = this;
        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.animate({
                height: targetHeight
            }, _.options.speed);
        }
    };

    Slick.prototype.animateSlide = function(targetLeft, callback) {

        var animProps = {},
            _ = this;

        _.animateHeight();

        if (_.options.rtl === true && _.options.vertical === false) {
            targetLeft = -targetLeft;
        }
        if (_.transformsEnabled === false) {
            if (_.options.vertical === false) {
                _.$slideTrack.animate({
                    left: targetLeft
                }, _.options.speed, _.options.easing, callback);
            } else {
                _.$slideTrack.animate({
                    top: targetLeft
                }, _.options.speed, _.options.easing, callback);
            }

        } else {

            if (_.cssTransitions === false) {
                if (_.options.rtl === true) {
                    _.currentLeft = -(_.currentLeft);
                }
                $({
                    animStart: _.currentLeft
                }).animate({
                    animStart: targetLeft
                }, {
                    duration: _.options.speed,
                    easing: _.options.easing,
                    step: function(now) {
                        now = Math.ceil(now);
                        if (_.options.vertical === false) {
                            animProps[_.animType] = 'translate(' +
                                now + 'px, 0px)';
                            _.$slideTrack.css(animProps);
                        } else {
                            animProps[_.animType] = 'translate(0px,' +
                                now + 'px)';
                            _.$slideTrack.css(animProps);
                        }
                    },
                    complete: function() {
                        if (callback) {
                            callback.call();
                        }
                    }
                });

            } else {

                _.applyTransition();
                targetLeft = Math.ceil(targetLeft);

                if (_.options.vertical === false) {
                    animProps[_.animType] = 'translate3d(' + targetLeft + 'px, 0px, 0px)';
                } else {
                    animProps[_.animType] = 'translate3d(0px,' + targetLeft + 'px, 0px)';
                }
                _.$slideTrack.css(animProps);

                if (callback) {
                    setTimeout(function() {

                        _.disableTransition();

                        callback.call();
                    }, _.options.speed);
                }

            }

        }

    };

    Slick.prototype.getNavTarget = function() {

        var _ = this,
            asNavFor = _.options.asNavFor;

        if (asNavFor && asNavFor !== null) {
            asNavFor = $(asNavFor).not(_.$slider);
        }

        return asNavFor;

    };

    Slick.prototype.asNavFor = function(index) {

        var _ = this,
            asNavFor = _.getNavTarget();

        if (asNavFor !== null && typeof asNavFor === 'object') {
            asNavFor.each(function() {
                var target = $(this).slick('getSlick');
                if (!target.unslicked) {
                    target.slideHandler(index, true);
                }
            });
        }

    };

    Slick.prototype.applyTransition = function(slide) {

        var _ = this,
            transition = {};

        if (_.options.fade === false) {
            transition[_.transitionType] = _.transformType + ' ' + _.options.speed + 'ms ' + _.options.cssEase;
        } else {
            transition[_.transitionType] = 'opacity ' + _.options.speed + 'ms ' + _.options.cssEase;
        }

        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }

    };

    Slick.prototype.autoPlay = function() {

        var _ = this;

        _.autoPlayClear();

        if (_.slideCount > _.options.slidesToShow) {
            _.autoPlayTimer = setInterval(_.autoPlayIterator, _.options.autoplaySpeed);
        }

    };

    Slick.prototype.autoPlayClear = function() {

        var _ = this;

        if (_.autoPlayTimer) {
            clearInterval(_.autoPlayTimer);
        }

    };

    Slick.prototype.autoPlayIterator = function() {

        var _ = this,
            slideTo = _.currentSlide + _.options.slidesToScroll;

        if (!_.paused && !_.interrupted && !_.focussed) {

            if (_.options.infinite === false) {

                if (_.direction === 1 && (_.currentSlide + 1) === (_.slideCount - 1)) {
                    _.direction = 0;
                } else if (_.direction === 0) {

                    slideTo = _.currentSlide - _.options.slidesToScroll;

                    if (_.currentSlide - 1 === 0) {
                        _.direction = 1;
                    }

                }

            }

            _.slideHandler(slideTo);

        }

    };

    Slick.prototype.buildArrows = function() {

        var _ = this;

        if (_.options.arrows === true) {

            _.$prevArrow = $(_.options.prevArrow).addClass('slick-arrow');
            _.$nextArrow = $(_.options.nextArrow).addClass('slick-arrow');

            if (_.slideCount > _.options.slidesToShow) {

                _.$prevArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');
                _.$nextArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');

                if (_.htmlExpr.test(_.options.prevArrow)) {
                    _.$prevArrow.prependTo(_.options.appendArrows);
                }

                if (_.htmlExpr.test(_.options.nextArrow)) {
                    _.$nextArrow.appendTo(_.options.appendArrows);
                }

                if (_.options.infinite !== true) {
                    _.$prevArrow
                        .addClass('slick-disabled')
                        .attr('aria-disabled', 'true');
                }

            } else {

                _.$prevArrow.add(_.$nextArrow)

                    .addClass('slick-hidden')
                    .attr({
                        'aria-disabled': 'true',
                        'tabindex': '-1'
                    });

            }

        }

    };

    Slick.prototype.buildDots = function() {

        var _ = this,
            i, dot;

        if (_.options.dots === true) {

            _.$slider.addClass('slick-dotted');

            dot = $('<ul />').addClass(_.options.dotsClass);

            for (i = 0; i <= _.getDotCount(); i += 1) {
                dot.append($('<li />').append(_.options.customPaging.call(this, _, i)));
            }

            _.$dots = dot.appendTo(_.options.appendDots);

            _.$dots.find('li').first().addClass('slick-active');

        }

    };

    Slick.prototype.buildOut = function() {

        var _ = this;

        _.$slides =
            _.$slider
            .children(_.options.slide + ':not(.slick-cloned)')
            .addClass('slick-slide');

        _.slideCount = _.$slides.length;

        _.$slides.each(function(index, element) {
            $(element)
                .attr('data-slick-index', index)
                .data('originalStyling', $(element).attr('style') || '');
        });

        _.$slider.addClass('slick-slider');

        _.$slideTrack = (_.slideCount === 0) ?
            $('<div class="slick-track"/>').appendTo(_.$slider) :
            _.$slides.wrapAll('<div class="slick-track"/>').parent();

        _.$list = _.$slideTrack.wrap(
            '<div class="slick-list"/>').parent();
        _.$slideTrack.css('opacity', 0);

        if (_.options.centerMode === true || _.options.swipeToSlide === true) {
            _.options.slidesToScroll = 1;
        }

        $('img[data-lazy]', _.$slider).not('[src]').addClass('slick-loading');

        _.setupInfinite();

        _.buildArrows();

        _.buildDots();

        _.updateDots();


        _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

        if (_.options.draggable === true) {
            _.$list.addClass('draggable');
        }

    };

    Slick.prototype.buildRows = function() {

        var _ = this,
            a, b, c, newSlides, numOfSlides, originalSlides, slidesPerSection;

        newSlides = document.createDocumentFragment();
        originalSlides = _.$slider.children();

        if (_.options.rows > 1) {

            slidesPerSection = _.options.slidesPerRow * _.options.rows;
            numOfSlides = Math.ceil(
                originalSlides.length / slidesPerSection
            );

            for (a = 0; a < numOfSlides; a++) {
                var slide = document.createElement('div');
                for (b = 0; b < _.options.rows; b++) {
                    var row = document.createElement('div');
                    for (c = 0; c < _.options.slidesPerRow; c++) {
                        var target = (a * slidesPerSection + ((b * _.options.slidesPerRow) + c));
                        if (originalSlides.get(target)) {
                            row.appendChild(originalSlides.get(target));
                        }
                    }
                    slide.appendChild(row);
                }
                newSlides.appendChild(slide);
            }

            _.$slider.empty().append(newSlides);
            _.$slider.children().children().children()
                .css({
                    'width': (100 / _.options.slidesPerRow) + '%',
                    'display': 'inline-block'
                });

        }

    };

    Slick.prototype.checkResponsive = function(initial, forceUpdate) {

        var _ = this,
            breakpoint, targetBreakpoint, respondToWidth, triggerBreakpoint = false;
        var sliderWidth = _.$slider.width();
        var windowWidth = window.innerWidth || $(window).width();

        if (_.respondTo === 'window') {
            respondToWidth = windowWidth;
        } else if (_.respondTo === 'slider') {
            respondToWidth = sliderWidth;
        } else if (_.respondTo === 'min') {
            respondToWidth = Math.min(windowWidth, sliderWidth);
        }

        if (_.options.responsive &&
            _.options.responsive.length &&
            _.options.responsive !== null) {

            targetBreakpoint = null;

            for (breakpoint in _.breakpoints) {
                if (_.breakpoints.hasOwnProperty(breakpoint)) {
                    if (_.originalSettings.mobileFirst === false) {
                        if (respondToWidth < _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    } else {
                        if (respondToWidth > _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    }
                }
            }

            if (targetBreakpoint !== null) {
                if (_.activeBreakpoint !== null) {
                    if (targetBreakpoint !== _.activeBreakpoint || forceUpdate) {
                        _.activeBreakpoint =
                            targetBreakpoint;
                        if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
                            _.unslick(targetBreakpoint);
                        } else {
                            _.options = $.extend({}, _.originalSettings,
                                _.breakpointSettings[
                                    targetBreakpoint]);
                            if (initial === true) {
                                _.currentSlide = _.options.initialSlide;
                            }
                            _.refresh(initial);
                        }
                        triggerBreakpoint = targetBreakpoint;
                    }
                } else {
                    _.activeBreakpoint = targetBreakpoint;
                    if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
                        _.unslick(targetBreakpoint);
                    } else {
                        _.options = $.extend({}, _.originalSettings,
                            _.breakpointSettings[
                                targetBreakpoint]);
                        if (initial === true) {
                            _.currentSlide = _.options.initialSlide;
                        }
                        _.refresh(initial);
                    }
                    triggerBreakpoint = targetBreakpoint;
                }
            } else {
                if (_.activeBreakpoint !== null) {
                    _.activeBreakpoint = null;
                    _.options = _.originalSettings;
                    if (initial === true) {
                        _.currentSlide = _.options.initialSlide;
                    }
                    _.refresh(initial);
                    triggerBreakpoint = targetBreakpoint;
                }
            }

            // only trigger breakpoints during an actual break. not on initialize.
            if (!initial && triggerBreakpoint !== false) {
                _.$slider.trigger('breakpoint', [_, triggerBreakpoint]);
            }
        }

    };

    Slick.prototype.changeSlide = function(event, dontAnimate) {

        var _ = this,
            $target = $(event.currentTarget),
            indexOffset, slideOffset, unevenOffset;

        // If target is a link, prevent default action.
        if ($target.is('a')) {
            event.preventDefault();
        }

        // If target is not the <li> element (ie: a child), find the <li>.
        if (!$target.is('li')) {
            $target = $target.closest('li');
        }

        unevenOffset = (_.slideCount % _.options.slidesToScroll !== 0);
        indexOffset = unevenOffset ? 0 : (_.slideCount - _.currentSlide) % _.options.slidesToScroll;

        switch (event.data.message) {

            case 'previous':
                slideOffset = indexOffset === 0 ? _.options.slidesToScroll : _.options.slidesToShow - indexOffset;
                if (_.slideCount > _.options.slidesToShow) {
                    _.slideHandler(_.currentSlide - slideOffset, false, dontAnimate);
                }
                break;

            case 'next':
                slideOffset = indexOffset === 0 ? _.options.slidesToScroll : indexOffset;
                if (_.slideCount > _.options.slidesToShow) {
                    _.slideHandler(_.currentSlide + slideOffset, false, dontAnimate);
                }
                break;

            case 'index':
                var index = event.data.index === 0 ? 0 :
                    event.data.index || $target.index() * _.options.slidesToScroll;

                _.slideHandler(_.checkNavigable(index), false, dontAnimate);
                $target.children().trigger('focus');
                break;

            default:
                return;
        }

    };

    Slick.prototype.checkNavigable = function(index) {

        var _ = this,
            navigables, prevNavigable;

        navigables = _.getNavigableIndexes();
        prevNavigable = 0;
        if (index > navigables[navigables.length - 1]) {
            index = navigables[navigables.length - 1];
        } else {
            for (var n in navigables) {
                if (index < navigables[n]) {
                    index = prevNavigable;
                    break;
                }
                prevNavigable = navigables[n];
            }
        }

        return index;
    };

    Slick.prototype.cleanUpEvents = function() {

        var _ = this;

        if (_.options.dots && _.$dots !== null) {

            $('li', _.$dots)
                .off('click.slick', _.changeSlide)
                .off('mouseenter.slick', $.proxy(_.interrupt, _, true))
                .off('mouseleave.slick', $.proxy(_.interrupt, _, false));

            if (_.options.accessibility === true) {
                _.$dots.off('keydown.slick', _.keyHandler);
            }
        }

        _.$slider.off('focus.slick blur.slick');

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow && _.$prevArrow.off('click.slick', _.changeSlide);
            _.$nextArrow && _.$nextArrow.off('click.slick', _.changeSlide);

            if (_.options.accessibility === true) {
                _.$prevArrow && _.$prevArrow.off('keydown.slick', _.keyHandler);
                _.$nextArrow && _.$nextArrow.off('keydown.slick', _.keyHandler);
            }
        }

        _.$list.off('touchstart.slick mousedown.slick', _.swipeHandler);
        _.$list.off('touchmove.slick mousemove.slick', _.swipeHandler);
        _.$list.off('touchend.slick mouseup.slick', _.swipeHandler);
        _.$list.off('touchcancel.slick mouseleave.slick', _.swipeHandler);

        _.$list.off('click.slick', _.clickHandler);

        $(document).off(_.visibilityChange, _.visibility);

        _.cleanUpSlideEvents();

        if (_.options.accessibility === true) {
            _.$list.off('keydown.slick', _.keyHandler);
        }

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().off('click.slick', _.selectHandler);
        }

        $(window).off('orientationchange.slick.slick-' + _.instanceUid, _.orientationChange);

        $(window).off('resize.slick.slick-' + _.instanceUid, _.resize);

        $('[draggable!=true]', _.$slideTrack).off('dragstart', _.preventDefault);

        $(window).off('load.slick.slick-' + _.instanceUid, _.setPosition);

    };

    Slick.prototype.cleanUpSlideEvents = function() {

        var _ = this;

        _.$list.off('mouseenter.slick', $.proxy(_.interrupt, _, true));
        _.$list.off('mouseleave.slick', $.proxy(_.interrupt, _, false));

    };

    Slick.prototype.cleanUpRows = function() {

        var _ = this,
            originalSlides;

        if (_.options.rows > 1) {
            originalSlides = _.$slides.children().children();
            originalSlides.removeAttr('style');
            _.$slider.empty().append(originalSlides);
        }

    };

    Slick.prototype.clickHandler = function(event) {

        var _ = this;

        if (_.shouldClick === false) {
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
        }

    };

    Slick.prototype.destroy = function(refresh) {

        var _ = this;

        _.autoPlayClear();

        _.touchObject = {};

        _.cleanUpEvents();

        $('.slick-cloned', _.$slider).detach();

        if (_.$dots) {
            _.$dots.remove();
        }

        if (_.$prevArrow && _.$prevArrow.length) {

            _.$prevArrow
                .removeClass('slick-disabled slick-arrow slick-hidden')
                .removeAttr('aria-hidden aria-disabled tabindex')
                .css('display', '');

            if (_.htmlExpr.test(_.options.prevArrow)) {
                _.$prevArrow.remove();
            }
        }

        if (_.$nextArrow && _.$nextArrow.length) {

            _.$nextArrow
                .removeClass('slick-disabled slick-arrow slick-hidden')
                .removeAttr('aria-hidden aria-disabled tabindex')
                .css('display', '');

            if (_.htmlExpr.test(_.options.nextArrow)) {
                _.$nextArrow.remove();
            }
        }


        if (_.$slides) {

            _.$slides
                .removeClass('slick-slide slick-active slick-center slick-visible slick-current')
                .removeAttr('aria-hidden')
                .removeAttr('data-slick-index')
                .each(function() {
                    $(this).attr('style', $(this).data('originalStyling'));
                });

            _.$slideTrack.children(this.options.slide).detach();

            _.$slideTrack.detach();

            _.$list.detach();

            _.$slider.append(_.$slides);
        }

        _.cleanUpRows();

        _.$slider.removeClass('slick-slider');
        _.$slider.removeClass('slick-initialized');
        _.$slider.removeClass('slick-dotted');

        _.unslicked = true;

        if (!refresh) {
            _.$slider.trigger('destroy', [_]);
        }

    };

    Slick.prototype.disableTransition = function(slide) {

        var _ = this,
            transition = {};

        transition[_.transitionType] = '';

        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }

    };

    Slick.prototype.fadeSlide = function(slideIndex, callback) {

        var _ = this;

        if (_.cssTransitions === false) {

            _.$slides.eq(slideIndex).css({
                zIndex: _.options.zIndex
            });

            _.$slides.eq(slideIndex).animate({
                opacity: 1
            }, _.options.speed, _.options.easing, callback);

        } else {

            _.applyTransition(slideIndex);

            _.$slides.eq(slideIndex).css({
                opacity: 1,
                zIndex: _.options.zIndex
            });

            if (callback) {
                setTimeout(function() {

                    _.disableTransition(slideIndex);

                    callback.call();
                }, _.options.speed);
            }

        }

    };

    Slick.prototype.fadeSlideOut = function(slideIndex) {

        var _ = this;

        if (_.cssTransitions === false) {

            _.$slides.eq(slideIndex).animate({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            }, _.options.speed, _.options.easing);

        } else {

            _.applyTransition(slideIndex);

            _.$slides.eq(slideIndex).css({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            });

        }

    };

    Slick.prototype.filterSlides = Slick.prototype.slickFilter = function(filter) {

        var _ = this;

        if (filter !== null) {

            _.$slidesCache = _.$slides;

            _.unload();

            _.$slideTrack.children(this.options.slide).detach();

            _.$slidesCache.filter(filter).appendTo(_.$slideTrack);

            _.reinit();

        }

    };

    Slick.prototype.focusHandler = function() {

        var _ = this;

        _.$slider
            .off('focus.slick blur.slick')
            .on('focus.slick blur.slick', '*', function(event) {

                event.stopImmediatePropagation();
                var $sf = $(this);

                setTimeout(function() {

                    if (_.options.pauseOnFocus) {
                        _.focussed = $sf.is(':focus');
                        _.autoPlay();
                    }

                }, 0);

            });
    };

    Slick.prototype.getCurrent = Slick.prototype.slickCurrentSlide = function() {

        var _ = this;
        return _.currentSlide;

    };

    Slick.prototype.getDotCount = function() {

        var _ = this;

        var breakPoint = 0;
        var counter = 0;
        var pagerQty = 0;

        if (_.options.infinite === true) {
            if (_.slideCount <= _.options.slidesToShow) {
                ++pagerQty;
            } else {
                while (breakPoint < _.slideCount) {
                    ++pagerQty;
                    breakPoint = counter + _.options.slidesToScroll;
                    counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
                }
            }
        } else if (_.options.centerMode === true) {
            pagerQty = _.slideCount;
        } else if (!_.options.asNavFor) {
            pagerQty = 1 + Math.ceil((_.slideCount - _.options.slidesToShow) / _.options.slidesToScroll);
        } else {
            while (breakPoint < _.slideCount) {
                ++pagerQty;
                breakPoint = counter + _.options.slidesToScroll;
                counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
            }
        }

        return pagerQty - 1;

    };

    Slick.prototype.getLeft = function(slideIndex) {

        var _ = this,
            targetLeft,
            verticalHeight,
            verticalOffset = 0,
            targetSlide,
            coef;

        _.slideOffset = 0;
        verticalHeight = _.$slides.first().outerHeight(true);

        if (_.options.infinite === true) {
            if (_.slideCount > _.options.slidesToShow) {
                _.slideOffset = (_.slideWidth * _.options.slidesToShow) * -1;
                coef = -1

                if (_.options.vertical === true && _.options.centerMode === true) {
                    if (_.options.slidesToShow === 2) {
                        coef = -1.5;
                    } else if (_.options.slidesToShow === 1) {
                        coef = -2
                    }
                }
                verticalOffset = (verticalHeight * _.options.slidesToShow) * coef;
            }
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                if (slideIndex + _.options.slidesToScroll > _.slideCount && _.slideCount > _.options.slidesToShow) {
                    if (slideIndex > _.slideCount) {
                        _.slideOffset = ((_.options.slidesToShow - (slideIndex - _.slideCount)) * _.slideWidth) * -1;
                        verticalOffset = ((_.options.slidesToShow - (slideIndex - _.slideCount)) * verticalHeight) * -1;
                    } else {
                        _.slideOffset = ((_.slideCount % _.options.slidesToScroll) * _.slideWidth) * -1;
                        verticalOffset = ((_.slideCount % _.options.slidesToScroll) * verticalHeight) * -1;
                    }
                }
            }
        } else {
            if (slideIndex + _.options.slidesToShow > _.slideCount) {
                _.slideOffset = ((slideIndex + _.options.slidesToShow) - _.slideCount) * _.slideWidth;
                verticalOffset = ((slideIndex + _.options.slidesToShow) - _.slideCount) * verticalHeight;
            }
        }

        if (_.slideCount <= _.options.slidesToShow) {
            _.slideOffset = 0;
            verticalOffset = 0;
        }

        if (_.options.centerMode === true && _.slideCount <= _.options.slidesToShow) {
            _.slideOffset = ((_.slideWidth * Math.floor(_.options.slidesToShow)) / 2) - ((_.slideWidth * _.slideCount) / 2);
        } else if (_.options.centerMode === true && _.options.infinite === true) {
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2) - _.slideWidth;
        } else if (_.options.centerMode === true) {
            _.slideOffset = 0;
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2);
        }

        if (_.options.vertical === false) {
            targetLeft = ((slideIndex * _.slideWidth) * -1) + _.slideOffset;
        } else {
            targetLeft = ((slideIndex * verticalHeight) * -1) + verticalOffset;
        }

        if (_.options.variableWidth === true) {

            if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
                targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
            } else {
                targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow);
            }

            if (_.options.rtl === true) {
                if (targetSlide[0]) {
                    targetLeft = (_.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                } else {
                    targetLeft = 0;
                }
            } else {
                targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
            }

            if (_.options.centerMode === true) {
                if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
                    targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
                } else {
                    targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow + 1);
                }

                if (_.options.rtl === true) {
                    if (targetSlide[0]) {
                        targetLeft = (_.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                    } else {
                        targetLeft = 0;
                    }
                } else {
                    targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
                }

                targetLeft += (_.$list.width() - targetSlide.outerWidth()) / 2;
            }
        }

        return targetLeft;

    };

    Slick.prototype.getOption = Slick.prototype.slickGetOption = function(option) {

        var _ = this;

        return _.options[option];

    };

    Slick.prototype.getNavigableIndexes = function() {

        var _ = this,
            breakPoint = 0,
            counter = 0,
            indexes = [],
            max;

        if (_.options.infinite === false) {
            max = _.slideCount;
        } else {
            breakPoint = _.options.slidesToScroll * -1;
            counter = _.options.slidesToScroll * -1;
            max = _.slideCount * 2;
        }

        while (breakPoint < max) {
            indexes.push(breakPoint);
            breakPoint = counter + _.options.slidesToScroll;
            counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
        }

        return indexes;

    };

    Slick.prototype.getSlick = function() {

        return this;

    };

    Slick.prototype.getSlideCount = function() {

        var _ = this,
            slidesTraversed, swipedSlide, centerOffset;

        centerOffset = _.options.centerMode === true ? _.slideWidth * Math.floor(_.options.slidesToShow / 2) : 0;

        if (_.options.swipeToSlide === true) {
            _.$slideTrack.find('.slick-slide').each(function(index, slide) {
                if (slide.offsetLeft - centerOffset + ($(slide).outerWidth() / 2) > (_.swipeLeft * -1)) {
                    swipedSlide = slide;
                    return false;
                }
            });

            slidesTraversed = Math.abs($(swipedSlide).attr('data-slick-index') - _.currentSlide) || 1;

            return slidesTraversed;

        } else {
            return _.options.slidesToScroll;
        }

    };

    Slick.prototype.goTo = Slick.prototype.slickGoTo = function(slide, dontAnimate) {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'index',
                index: parseInt(slide)
            }
        }, dontAnimate);

    };

    Slick.prototype.init = function(creation) {

        var _ = this;

        if (!$(_.$slider).hasClass('slick-initialized')) {

            $(_.$slider).addClass('slick-initialized');

            _.buildRows();
            _.buildOut();
            _.setProps();
            _.startLoad();
            _.loadSlider();
            _.initializeEvents();
            _.updateArrows();
            _.updateDots();
            _.checkResponsive(true);
            _.focusHandler();

        }

        if (creation) {
            _.$slider.trigger('init', [_]);
        }

        if (_.options.accessibility === true) {
            _.initADA();
        }

        if (_.options.autoplay) {

            _.paused = false;
            _.autoPlay();

        }

    };

    Slick.prototype.initADA = function() {
        var _ = this,
            numDotGroups = Math.ceil(_.slideCount / _.options.slidesToShow),
            tabControlIndexes = _.getNavigableIndexes().filter(function(val) {
                return (val >= 0) && (val < _.slideCount);
            });

        _.$slides.add(_.$slideTrack.find('.slick-cloned')).attr({
            'aria-hidden': 'true',
            'tabindex': '-1'
        }).find('a, input, button, select').attr({
            'tabindex': '-1'
        });

        if (_.$dots !== null) {
            _.$slides.not(_.$slideTrack.find('.slick-cloned')).each(function(i) {
                var slideControlIndex = tabControlIndexes.indexOf(i);

                $(this).attr({
                    'role': 'tabpanel',
                    'id': 'slick-slide' + _.instanceUid + i,
                    'tabindex': -1
                });

                if (slideControlIndex !== -1) {
                    $(this).attr({
                        'aria-describedby': 'slick-slide-control' + _.instanceUid + slideControlIndex
                    });
                }
            });

            _.$dots.attr('role', 'tablist').find('li').each(function(i) {
                var mappedSlideIndex = tabControlIndexes[i];

                $(this).attr({
                    'role': 'presentation'
                });

                $(this).find('button').first().attr({
                    'role': 'tab',
                    'id': 'slick-slide-control' + _.instanceUid + i,
                    'aria-controls': 'slick-slide' + _.instanceUid + mappedSlideIndex,
                    'aria-label': (i + 1) + ' of ' + numDotGroups,
                    'aria-selected': null,
                    'tabindex': '-1'
                });

            }).eq(_.currentSlide).find('button').attr({
                'aria-selected': 'true',
                'tabindex': '0'
            }).end();
        }

        for (var i = _.currentSlide, max = i + _.options.slidesToShow; i < max; i++) {
            _.$slides.eq(i).attr('tabindex', 0);
        }

        _.activateADA();

    };

    Slick.prototype.initArrowEvents = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow
                .off('click.slick')
                .on('click.slick', {
                    message: 'previous'
                }, _.changeSlide);
            _.$nextArrow
                .off('click.slick')
                .on('click.slick', {
                    message: 'next'
                }, _.changeSlide);

            if (_.options.accessibility === true) {
                _.$prevArrow.on('keydown.slick', _.keyHandler);
                _.$nextArrow.on('keydown.slick', _.keyHandler);
            }
        }

    };

    Slick.prototype.initDotEvents = function() {

        var _ = this;

        if (_.options.dots === true) {
            $('li', _.$dots).on('click.slick', {
                message: 'index'
            }, _.changeSlide);

            if (_.options.accessibility === true) {
                _.$dots.on('keydown.slick', _.keyHandler);
            }
        }

        if (_.options.dots === true && _.options.pauseOnDotsHover === true) {

            $('li', _.$dots)
                .on('mouseenter.slick', $.proxy(_.interrupt, _, true))
                .on('mouseleave.slick', $.proxy(_.interrupt, _, false));

        }

    };

    Slick.prototype.initSlideEvents = function() {

        var _ = this;

        if (_.options.pauseOnHover) {

            _.$list.on('mouseenter.slick', $.proxy(_.interrupt, _, true));
            _.$list.on('mouseleave.slick', $.proxy(_.interrupt, _, false));

        }

    };

    Slick.prototype.initializeEvents = function() {

        var _ = this;

        _.initArrowEvents();

        _.initDotEvents();
        _.initSlideEvents();

        _.$list.on('touchstart.slick mousedown.slick', {
            action: 'start'
        }, _.swipeHandler);
        _.$list.on('touchmove.slick mousemove.slick', {
            action: 'move'
        }, _.swipeHandler);
        _.$list.on('touchend.slick mouseup.slick', {
            action: 'end'
        }, _.swipeHandler);
        _.$list.on('touchcancel.slick mouseleave.slick', {
            action: 'end'
        }, _.swipeHandler);

        _.$list.on('click.slick', _.clickHandler);

        $(document).on(_.visibilityChange, $.proxy(_.visibility, _));

        if (_.options.accessibility === true) {
            _.$list.on('keydown.slick', _.keyHandler);
        }

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on('click.slick', _.selectHandler);
        }

        $(window).on('orientationchange.slick.slick-' + _.instanceUid, $.proxy(_.orientationChange, _));

        $(window).on('resize.slick.slick-' + _.instanceUid, $.proxy(_.resize, _));

        $('[draggable!=true]', _.$slideTrack).on('dragstart', _.preventDefault);

        $(window).on('load.slick.slick-' + _.instanceUid, _.setPosition);
        $(_.setPosition);

    };

    Slick.prototype.initUI = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

            _.$prevArrow.show();
            _.$nextArrow.show();

        }

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$dots.show();

        }

    };

    Slick.prototype.keyHandler = function(event) {

        var _ = this;
        //Dont slide if the cursor is inside the form fields and arrow keys are pressed
        if (!event.target.tagName.match('TEXTAREA|INPUT|SELECT')) {
            if (event.keyCode === 37 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: _.options.rtl === true ? 'next' : 'previous'
                    }
                });
            } else if (event.keyCode === 39 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: _.options.rtl === true ? 'previous' : 'next'
                    }
                });
            }
        }

    };

    Slick.prototype.lazyLoad = function() {

        var _ = this,
            loadRange, cloneRange, rangeStart, rangeEnd;

        function loadImages(imagesScope) {

            $('img[data-lazy]', imagesScope).each(function() {

                var image = $(this),
                    imageSource = $(this).attr('data-lazy'),
                    imageSrcSet = $(this).attr('data-srcset'),
                    imageSizes = $(this).attr('data-sizes') || _.$slider.attr('data-sizes'),
                    imageToLoad = document.createElement('img');

                imageToLoad.onload = function() {

                    image
                        .animate({ opacity: 0 }, 100, function() {

                            if (imageSrcSet) {
                                image
                                    .attr('srcset', imageSrcSet);

                                if (imageSizes) {
                                    image
                                        .attr('sizes', imageSizes);
                                }
                            }

                            image
                                .attr('src', imageSource)
                                .animate({ opacity: 1 }, 200, function() {
                                    image
                                        .removeAttr('data-lazy data-srcset data-sizes')
                                        .removeClass('slick-loading');
                                });
                            _.$slider.trigger('lazyLoaded', [_, image, imageSource]);
                        });

                };

                imageToLoad.onerror = function() {

                    image
                        .removeAttr('data-lazy')
                        .removeClass('slick-loading')
                        .addClass('slick-lazyload-error');

                    _.$slider.trigger('lazyLoadError', [_, image, imageSource]);

                };

                imageToLoad.src = imageSource;

            });

        }

        if (_.options.centerMode === true) {
            if (_.options.infinite === true) {
                rangeStart = _.currentSlide + (_.options.slidesToShow / 2 + 1);
                rangeEnd = rangeStart + _.options.slidesToShow + 2;
            } else {
                rangeStart = Math.max(0, _.currentSlide - (_.options.slidesToShow / 2 + 1));
                rangeEnd = 2 + (_.options.slidesToShow / 2 + 1) + _.currentSlide;
            }
        } else {
            rangeStart = _.options.infinite ? _.options.slidesToShow + _.currentSlide : _.currentSlide;
            rangeEnd = Math.ceil(rangeStart + _.options.slidesToShow);
            if (_.options.fade === true) {
                if (rangeStart > 0) rangeStart--;
                if (rangeEnd <= _.slideCount) rangeEnd++;
            }
        }

        loadRange = _.$slider.find('.slick-slide').slice(rangeStart, rangeEnd);

        if (_.options.lazyLoad === 'anticipated') {
            var prevSlide = rangeStart - 1,
                nextSlide = rangeEnd,
                $slides = _.$slider.find('.slick-slide');

            for (var i = 0; i < _.options.slidesToScroll; i++) {
                if (prevSlide < 0) prevSlide = _.slideCount - 1;
                loadRange = loadRange.add($slides.eq(prevSlide));
                loadRange = loadRange.add($slides.eq(nextSlide));
                prevSlide--;
                nextSlide++;
            }
        }

        loadImages(loadRange);

        if (_.slideCount <= _.options.slidesToShow) {
            cloneRange = _.$slider.find('.slick-slide');
            loadImages(cloneRange);
        } else
        if (_.currentSlide >= _.slideCount - _.options.slidesToShow) {
            cloneRange = _.$slider.find('.slick-cloned').slice(0, _.options.slidesToShow);
            loadImages(cloneRange);
        } else if (_.currentSlide === 0) {
            cloneRange = _.$slider.find('.slick-cloned').slice(_.options.slidesToShow * -1);
            loadImages(cloneRange);
        }

    };

    Slick.prototype.loadSlider = function() {

        var _ = this;

        _.setPosition();

        _.$slideTrack.css({
            opacity: 1
        });

        _.$slider.removeClass('slick-loading');

        _.initUI();

        if (_.options.lazyLoad === 'progressive') {
            _.progressiveLazyLoad();
        }

    };

    Slick.prototype.next = Slick.prototype.slickNext = function() {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'next'
            }
        });

    };

    Slick.prototype.orientationChange = function() {

        var _ = this;

        _.checkResponsive();
        _.setPosition();

    };

    Slick.prototype.pause = Slick.prototype.slickPause = function() {

        var _ = this;

        _.autoPlayClear();
        _.paused = true;

    };

    Slick.prototype.play = Slick.prototype.slickPlay = function() {

        var _ = this;

        _.autoPlay();
        _.options.autoplay = true;
        _.paused = false;
        _.focussed = false;
        _.interrupted = false;

    };

    Slick.prototype.postSlide = function(index) {

        var _ = this;

        if (!_.unslicked) {

            _.$slider.trigger('afterChange', [_, index]);

            _.animating = false;

            if (_.slideCount > _.options.slidesToShow) {
                _.setPosition();
            }

            _.swipeLeft = null;

            if (_.options.autoplay) {
                _.autoPlay();
            }

            if (_.options.accessibility === true) {
                _.initADA();

                if (_.options.focusOnChange) {
                    var $currentSlide = $(_.$slides.get(_.currentSlide));
                    $currentSlide.attr('tabindex', 0).focus();
                }
            }

        }

    };

    Slick.prototype.prev = Slick.prototype.slickPrev = function() {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'previous'
            }
        });

    };

    Slick.prototype.preventDefault = function(event) {

        event.preventDefault();

    };

    Slick.prototype.progressiveLazyLoad = function(tryCount) {

        tryCount = tryCount || 1;

        var _ = this,
            $imgsToLoad = $('img[data-lazy]', _.$slider),
            image,
            imageSource,
            imageSrcSet,
            imageSizes,
            imageToLoad;

        if ($imgsToLoad.length) {

            image = $imgsToLoad.first();
            imageSource = image.attr('data-lazy');
            imageSrcSet = image.attr('data-srcset');
            imageSizes = image.attr('data-sizes') || _.$slider.attr('data-sizes');
            imageToLoad = document.createElement('img');

            imageToLoad.onload = function() {

                if (imageSrcSet) {
                    image
                        .attr('srcset', imageSrcSet);

                    if (imageSizes) {
                        image
                            .attr('sizes', imageSizes);
                    }
                }

                image
                    .attr('src', imageSource)
                    .removeAttr('data-lazy data-srcset data-sizes')
                    .removeClass('slick-loading');

                if (_.options.adaptiveHeight === true) {
                    _.setPosition();
                }

                _.$slider.trigger('lazyLoaded', [_, image, imageSource]);
                _.progressiveLazyLoad();

            };

            imageToLoad.onerror = function() {

                if (tryCount < 3) {

                    /**
                     * try to load the image 3 times,
                     * leave a slight delay so we don't get
                     * servers blocking the request.
                     */
                    setTimeout(function() {
                        _.progressiveLazyLoad(tryCount + 1);
                    }, 500);

                } else {

                    image
                        .removeAttr('data-lazy')
                        .removeClass('slick-loading')
                        .addClass('slick-lazyload-error');

                    _.$slider.trigger('lazyLoadError', [_, image, imageSource]);

                    _.progressiveLazyLoad();

                }

            };

            imageToLoad.src = imageSource;

        } else {

            _.$slider.trigger('allImagesLoaded', [_]);

        }

    };

    Slick.prototype.refresh = function(initializing) {

        var _ = this,
            currentSlide, lastVisibleIndex;

        lastVisibleIndex = _.slideCount - _.options.slidesToShow;

        // in non-infinite sliders, we don't want to go past the
        // last visible index.
        if (!_.options.infinite && (_.currentSlide > lastVisibleIndex)) {
            _.currentSlide = lastVisibleIndex;
        }

        // if less slides than to show, go to start.
        if (_.slideCount <= _.options.slidesToShow) {
            _.currentSlide = 0;

        }

        currentSlide = _.currentSlide;

        _.destroy(true);

        $.extend(_, _.initials, { currentSlide: currentSlide });

        _.init();

        if (!initializing) {

            _.changeSlide({
                data: {
                    message: 'index',
                    index: currentSlide
                }
            }, false);

        }

    };

    Slick.prototype.registerBreakpoints = function() {

        var _ = this,
            breakpoint, currentBreakpoint, l,
            responsiveSettings = _.options.responsive || null;

        if ($.type(responsiveSettings) === 'array' && responsiveSettings.length) {

            _.respondTo = _.options.respondTo || 'window';

            for (breakpoint in responsiveSettings) {

                l = _.breakpoints.length - 1;

                if (responsiveSettings.hasOwnProperty(breakpoint)) {
                    currentBreakpoint = responsiveSettings[breakpoint].breakpoint;

                    // loop through the breakpoints and cut out any existing
                    // ones with the same breakpoint number, we don't want dupes.
                    while (l >= 0) {
                        if (_.breakpoints[l] && _.breakpoints[l] === currentBreakpoint) {
                            _.breakpoints.splice(l, 1);
                        }
                        l--;
                    }

                    _.breakpoints.push(currentBreakpoint);
                    _.breakpointSettings[currentBreakpoint] = responsiveSettings[breakpoint].settings;

                }

            }

            _.breakpoints.sort(function(a, b) {
                return (_.options.mobileFirst) ? a - b : b - a;
            });

        }

    };

    Slick.prototype.reinit = function() {

        var _ = this;

        _.$slides =
            _.$slideTrack
            .children(_.options.slide)
            .addClass('slick-slide');

        _.slideCount = _.$slides.length;

        if (_.currentSlide >= _.slideCount && _.currentSlide !== 0) {
            _.currentSlide = _.currentSlide - _.options.slidesToScroll;
        }

        if (_.slideCount <= _.options.slidesToShow) {
            _.currentSlide = 0;
        }

        _.registerBreakpoints();

        _.setProps();
        _.setupInfinite();
        _.buildArrows();
        _.updateArrows();
        _.initArrowEvents();
        _.buildDots();
        _.updateDots();
        _.initDotEvents();
        _.cleanUpSlideEvents();
        _.initSlideEvents();

        _.checkResponsive(false, true);

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on('click.slick', _.selectHandler);
        }

        _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

        _.setPosition();
        _.focusHandler();

        _.paused = !_.options.autoplay;
        _.autoPlay();

        _.$slider.trigger('reInit', [_]);

    };

    Slick.prototype.resize = function() {

        var _ = this;

        if ($(window).width() !== _.windowWidth) {
            clearTimeout(_.windowDelay);
            _.windowDelay = window.setTimeout(function() {
                _.windowWidth = $(window).width();
                _.checkResponsive();
                if (!_.unslicked) { _.setPosition(); }
            }, 50);
        }
    };

    Slick.prototype.removeSlide = Slick.prototype.slickRemove = function(index, removeBefore, removeAll) {

        var _ = this;

        if (typeof(index) === 'boolean') {
            removeBefore = index;
            index = removeBefore === true ? 0 : _.slideCount - 1;
        } else {
            index = removeBefore === true ? --index : index;
        }

        if (_.slideCount < 1 || index < 0 || index > _.slideCount - 1) {
            return false;
        }

        _.unload();

        if (removeAll === true) {
            _.$slideTrack.children().remove();
        } else {
            _.$slideTrack.children(this.options.slide).eq(index).remove();
        }

        _.$slides = _.$slideTrack.children(this.options.slide);

        _.$slideTrack.children(this.options.slide).detach();

        _.$slideTrack.append(_.$slides);

        _.$slidesCache = _.$slides;

        _.reinit();

    };

    Slick.prototype.setCSS = function(position) {

        var _ = this,
            positionProps = {},
            x, y;

        if (_.options.rtl === true) {
            position = -position;
        }
        x = _.positionProp == 'left' ? Math.ceil(position) + 'px' : '0px';
        y = _.positionProp == 'top' ? Math.ceil(position) + 'px' : '0px';

        positionProps[_.positionProp] = position;

        if (_.transformsEnabled === false) {
            _.$slideTrack.css(positionProps);
        } else {
            positionProps = {};
            if (_.cssTransitions === false) {
                positionProps[_.animType] = 'translate(' + x + ', ' + y + ')';
                _.$slideTrack.css(positionProps);
            } else {
                positionProps[_.animType] = 'translate3d(' + x + ', ' + y + ', 0px)';
                _.$slideTrack.css(positionProps);
            }
        }

    };

    Slick.prototype.setDimensions = function() {

        var _ = this;

        if (_.options.vertical === false) {
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: ('0px ' + _.options.centerPadding)
                });
            }
        } else {
            _.$list.height(_.$slides.first().outerHeight(true) * _.options.slidesToShow);
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: (_.options.centerPadding + ' 0px')
                });
            }
        }

        _.listWidth = _.$list.width();
        _.listHeight = _.$list.height();


        if (_.options.vertical === false && _.options.variableWidth === false) {
            _.slideWidth = Math.ceil(_.listWidth / _.options.slidesToShow);
            _.$slideTrack.width(Math.ceil((_.slideWidth * _.$slideTrack.children('.slick-slide').length)));

        } else if (_.options.variableWidth === true) {
            _.$slideTrack.width(5000 * _.slideCount);
        } else {
            _.slideWidth = Math.ceil(_.listWidth);
            _.$slideTrack.height(Math.ceil((_.$slides.first().outerHeight(true) * _.$slideTrack.children('.slick-slide').length)));
        }

        var offset = _.$slides.first().outerWidth(true) - _.$slides.first().width();
        if (_.options.variableWidth === false) _.$slideTrack.children('.slick-slide').width(_.slideWidth - offset);

    };

    Slick.prototype.setFade = function() {

        var _ = this,
            targetLeft;

        _.$slides.each(function(index, element) {
            targetLeft = (_.slideWidth * index) * -1;
            if (_.options.rtl === true) {
                $(element).css({
                    position: 'relative',
                    right: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            } else {
                $(element).css({
                    position: 'relative',
                    left: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            }
        });

        _.$slides.eq(_.currentSlide).css({
            zIndex: _.options.zIndex - 1,
            opacity: 1
        });

    };

    Slick.prototype.setHeight = function() {

        var _ = this;

        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.css('height', targetHeight);
        }

    };

    Slick.prototype.setOption =
        Slick.prototype.slickSetOption = function() {

            /**
             * accepts arguments in format of:
             *
             *  - for changing a single option's value:
             *     .slick("setOption", option, value, refresh )
             *
             *  - for changing a set of responsive options:
             *     .slick("setOption", 'responsive', [{}, ...], refresh )
             *
             *  - for updating multiple values at once (not responsive)
             *     .slick("setOption", { 'option': value, ... }, refresh )
             */

            var _ = this,
                l, item, option, value, refresh = false,
                type;

            if ($.type(arguments[0]) === 'object') {

                option = arguments[0];
                refresh = arguments[1];
                type = 'multiple';

            } else if ($.type(arguments[0]) === 'string') {

                option = arguments[0];
                value = arguments[1];
                refresh = arguments[2];

                if (arguments[0] === 'responsive' && $.type(arguments[1]) === 'array') {

                    type = 'responsive';

                } else if (typeof arguments[1] !== 'undefined') {

                    type = 'single';

                }

            }

            if (type === 'single') {

                _.options[option] = value;


            } else if (type === 'multiple') {

                $.each(option, function(opt, val) {

                    _.options[opt] = val;

                });


            } else if (type === 'responsive') {

                for (item in value) {

                    if ($.type(_.options.responsive) !== 'array') {

                        _.options.responsive = [value[item]];

                    } else {

                        l = _.options.responsive.length - 1;

                        // loop through the responsive object and splice out duplicates.
                        while (l >= 0) {

                            if (_.options.responsive[l].breakpoint === value[item].breakpoint) {

                                _.options.responsive.splice(l, 1);

                            }

                            l--;

                        }

                        _.options.responsive.push(value[item]);

                    }

                }

            }

            if (refresh) {

                _.unload();
                _.reinit();

            }

        };

    Slick.prototype.setPosition = function() {

        var _ = this;

        _.setDimensions();

        _.setHeight();

        if (_.options.fade === false) {
            _.setCSS(_.getLeft(_.currentSlide));
        } else {
            _.setFade();
        }

        _.$slider.trigger('setPosition', [_]);

    };

    Slick.prototype.setProps = function() {

        var _ = this,
            bodyStyle = document.body.style;

        _.positionProp = _.options.vertical === true ? 'top' : 'left';

        if (_.positionProp === 'top') {
            _.$slider.addClass('slick-vertical');
        } else {
            _.$slider.removeClass('slick-vertical');
        }

        if (bodyStyle.WebkitTransition !== undefined ||
            bodyStyle.MozTransition !== undefined ||
            bodyStyle.msTransition !== undefined) {
            if (_.options.useCSS === true) {
                _.cssTransitions = true;
            }
        }

        if (_.options.fade) {
            if (typeof _.options.zIndex === 'number') {
                if (_.options.zIndex < 3) {
                    _.options.zIndex = 3;
                }
            } else {
                _.options.zIndex = _.defaults.zIndex;
            }
        }

        if (bodyStyle.OTransform !== undefined) {
            _.animType = 'OTransform';
            _.transformType = '-o-transform';
            _.transitionType = 'OTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.MozTransform !== undefined) {
            _.animType = 'MozTransform';
            _.transformType = '-moz-transform';
            _.transitionType = 'MozTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.MozPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.webkitTransform !== undefined) {
            _.animType = 'webkitTransform';
            _.transformType = '-webkit-transform';
            _.transitionType = 'webkitTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.msTransform !== undefined) {
            _.animType = 'msTransform';
            _.transformType = '-ms-transform';
            _.transitionType = 'msTransition';
            if (bodyStyle.msTransform === undefined) _.animType = false;
        }
        if (bodyStyle.transform !== undefined && _.animType !== false) {
            _.animType = 'transform';
            _.transformType = 'transform';
            _.transitionType = 'transition';
        }
        _.transformsEnabled = _.options.useTransform && (_.animType !== null && _.animType !== false);
    };


    Slick.prototype.setSlideClasses = function(index) {

        var _ = this,
            centerOffset, allSlides, indexOffset, remainder;

        allSlides = _.$slider
            .find('.slick-slide')
            .removeClass('slick-active slick-center slick-current')
            .attr('aria-hidden', 'true');

        _.$slides
            .eq(index)
            .addClass('slick-current');

        if (_.options.centerMode === true) {

            var evenCoef = _.options.slidesToShow % 2 === 0 ? 1 : 0;

            centerOffset = Math.floor(_.options.slidesToShow / 2);

            if (_.options.infinite === true) {

                if (index >= centerOffset && index <= (_.slideCount - 1) - centerOffset) {
                    _.$slides
                        .slice(index - centerOffset + evenCoef, index + centerOffset + 1)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                } else {

                    indexOffset = _.options.slidesToShow + index;
                    allSlides
                        .slice(indexOffset - centerOffset + 1 + evenCoef, indexOffset + centerOffset + 2)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                }

                if (index === 0) {

                    allSlides
                        .eq(allSlides.length - 1 - _.options.slidesToShow)
                        .addClass('slick-center');

                } else if (index === _.slideCount - 1) {

                    allSlides
                        .eq(_.options.slidesToShow)
                        .addClass('slick-center');

                }

            }

            _.$slides
                .eq(index)
                .addClass('slick-center');

        } else {

            if (index >= 0 && index <= (_.slideCount - _.options.slidesToShow)) {

                _.$slides
                    .slice(index, index + _.options.slidesToShow)
                    .addClass('slick-active')
                    .attr('aria-hidden', 'false');

            } else if (allSlides.length <= _.options.slidesToShow) {

                allSlides
                    .addClass('slick-active')
                    .attr('aria-hidden', 'false');

            } else {

                remainder = _.slideCount % _.options.slidesToShow;
                indexOffset = _.options.infinite === true ? _.options.slidesToShow + index : index;

                if (_.options.slidesToShow == _.options.slidesToScroll && (_.slideCount - index) < _.options.slidesToShow) {

                    allSlides
                        .slice(indexOffset - (_.options.slidesToShow - remainder), indexOffset + remainder)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                } else {

                    allSlides
                        .slice(indexOffset, indexOffset + _.options.slidesToShow)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                }

            }

        }

        if (_.options.lazyLoad === 'ondemand' || _.options.lazyLoad === 'anticipated') {
            _.lazyLoad();
        }
    };

    Slick.prototype.setupInfinite = function() {

        var _ = this,
            i, slideIndex, infiniteCount;

        if (_.options.fade === true) {
            _.options.centerMode = false;
        }

        if (_.options.infinite === true && _.options.fade === false) {

            slideIndex = null;

            if (_.slideCount > _.options.slidesToShow) {

                if (_.options.centerMode === true) {
                    infiniteCount = _.options.slidesToShow + 1;
                } else {
                    infiniteCount = _.options.slidesToShow;
                }

                for (i = _.slideCount; i > (_.slideCount -
                        infiniteCount); i -= 1) {
                    slideIndex = i - 1;
                    $(_.$slides[slideIndex]).clone(true).attr('id', '')
                        .attr('data-slick-index', slideIndex - _.slideCount)
                        .prependTo(_.$slideTrack).addClass('slick-cloned');
                }
                for (i = 0; i < infiniteCount + _.slideCount; i += 1) {
                    slideIndex = i;
                    $(_.$slides[slideIndex]).clone(true).attr('id', '')
                        .attr('data-slick-index', slideIndex + _.slideCount)
                        .appendTo(_.$slideTrack).addClass('slick-cloned');
                }
                _.$slideTrack.find('.slick-cloned').find('[id]').each(function() {
                    $(this).attr('id', '');
                });

            }

        }

    };

    Slick.prototype.interrupt = function(toggle) {

        var _ = this;

        if (!toggle) {
            _.autoPlay();
        }
        _.interrupted = toggle;

    };

    Slick.prototype.selectHandler = function(event) {

        var _ = this;

        var targetElement =
            $(event.target).is('.slick-slide') ?
            $(event.target) :
            $(event.target).parents('.slick-slide');

        var index = parseInt(targetElement.attr('data-slick-index'));

        if (!index) index = 0;

        if (_.slideCount <= _.options.slidesToShow) {

            _.slideHandler(index, false, true);
            return;

        }

        _.slideHandler(index);

    };

    Slick.prototype.slideHandler = function(index, sync, dontAnimate) {

        var targetSlide, animSlide, oldSlide, slideLeft, targetLeft = null,
            _ = this,
            navTarget;

        sync = sync || false;

        if (_.animating === true && _.options.waitForAnimate === true) {
            return;
        }

        if (_.options.fade === true && _.currentSlide === index) {
            return;
        }

        if (sync === false) {
            _.asNavFor(index);
        }

        targetSlide = index;
        targetLeft = _.getLeft(targetSlide);
        slideLeft = _.getLeft(_.currentSlide);

        _.currentLeft = _.swipeLeft === null ? slideLeft : _.swipeLeft;

        if (_.options.infinite === false && _.options.centerMode === false && (index < 0 || index > _.getDotCount() * _.options.slidesToScroll)) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true) {
                    _.animateSlide(slideLeft, function() {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        } else if (_.options.infinite === false && _.options.centerMode === true && (index < 0 || index > (_.slideCount - _.options.slidesToScroll))) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true) {
                    _.animateSlide(slideLeft, function() {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        }

        if (_.options.autoplay) {
            clearInterval(_.autoPlayTimer);
        }

        if (targetSlide < 0) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = _.slideCount - (_.slideCount % _.options.slidesToScroll);
            } else {
                animSlide = _.slideCount + targetSlide;
            }
        } else if (targetSlide >= _.slideCount) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = 0;
            } else {
                animSlide = targetSlide - _.slideCount;
            }
        } else {
            animSlide = targetSlide;
        }

        _.animating = true;

        _.$slider.trigger('beforeChange', [_, _.currentSlide, animSlide]);

        oldSlide = _.currentSlide;
        _.currentSlide = animSlide;

        _.setSlideClasses(_.currentSlide);

        if (_.options.asNavFor) {

            navTarget = _.getNavTarget();
            navTarget = navTarget.slick('getSlick');

            if (navTarget.slideCount <= navTarget.options.slidesToShow) {
                navTarget.setSlideClasses(_.currentSlide);
            }

        }

        _.updateDots();
        _.updateArrows();

        if (_.options.fade === true) {
            if (dontAnimate !== true) {

                _.fadeSlideOut(oldSlide);

                _.fadeSlide(animSlide, function() {
                    _.postSlide(animSlide);
                });

            } else {
                _.postSlide(animSlide);
            }
            _.animateHeight();
            return;
        }

        if (dontAnimate !== true) {
            _.animateSlide(targetLeft, function() {
                _.postSlide(animSlide);
            });
        } else {
            _.postSlide(animSlide);
        }

    };

    Slick.prototype.startLoad = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

            _.$prevArrow.hide();
            _.$nextArrow.hide();

        }

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$dots.hide();

        }

        _.$slider.addClass('slick-loading');

    };

    Slick.prototype.swipeDirection = function() {

        var xDist, yDist, r, swipeAngle, _ = this;

        xDist = _.touchObject.startX - _.touchObject.curX;
        yDist = _.touchObject.startY - _.touchObject.curY;
        r = Math.atan2(yDist, xDist);

        swipeAngle = Math.round(r * 180 / Math.PI);
        if (swipeAngle < 0) {
            swipeAngle = 360 - Math.abs(swipeAngle);
        }

        if ((swipeAngle <= 45) && (swipeAngle >= 0)) {
            return (_.options.rtl === false ? 'left' : 'right');
        }
        if ((swipeAngle <= 360) && (swipeAngle >= 315)) {
            return (_.options.rtl === false ? 'left' : 'right');
        }
        if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
            return (_.options.rtl === false ? 'right' : 'left');
        }
        if (_.options.verticalSwiping === true) {
            if ((swipeAngle >= 35) && (swipeAngle <= 135)) {
                return 'down';
            } else {
                return 'up';
            }
        }

        return 'vertical';

    };

    Slick.prototype.swipeEnd = function(event) {

        var _ = this,
            slideCount,
            direction;

        _.dragging = false;
        _.swiping = false;

        if (_.scrolling) {
            _.scrolling = false;
            return false;
        }

        _.interrupted = false;
        _.shouldClick = (_.touchObject.swipeLength > 10) ? false : true;

        if (_.touchObject.curX === undefined) {
            return false;
        }

        if (_.touchObject.edgeHit === true) {
            _.$slider.trigger('edge', [_, _.swipeDirection()]);
        }

        if (_.touchObject.swipeLength >= _.touchObject.minSwipe) {

            direction = _.swipeDirection();

            switch (direction) {

                case 'left':
                case 'down':

                    slideCount =
                        _.options.swipeToSlide ?
                        _.checkNavigable(_.currentSlide + _.getSlideCount()) :
                        _.currentSlide + _.getSlideCount();

                    _.currentDirection = 0;

                    break;

                case 'right':
                case 'up':

                    slideCount =
                        _.options.swipeToSlide ?
                        _.checkNavigable(_.currentSlide - _.getSlideCount()) :
                        _.currentSlide - _.getSlideCount();

                    _.currentDirection = 1;

                    break;

                default:


            }

            if (direction != 'vertical') {

                _.slideHandler(slideCount);
                _.touchObject = {};
                _.$slider.trigger('swipe', [_, direction]);

            }

        } else {

            if (_.touchObject.startX !== _.touchObject.curX) {

                _.slideHandler(_.currentSlide);
                _.touchObject = {};

            }

        }

    };

    Slick.prototype.swipeHandler = function(event) {

        var _ = this;

        if ((_.options.swipe === false) || ('ontouchend' in document && _.options.swipe === false)) {
            return;
        } else if (_.options.draggable === false && event.type.indexOf('mouse') !== -1) {
            return;
        }

        _.touchObject.fingerCount = event.originalEvent && event.originalEvent.touches !== undefined ?
            event.originalEvent.touches.length : 1;

        _.touchObject.minSwipe = _.listWidth / _.options
            .touchThreshold;

        if (_.options.verticalSwiping === true) {
            _.touchObject.minSwipe = _.listHeight / _.options
                .touchThreshold;
        }

        switch (event.data.action) {

            case 'start':
                _.swipeStart(event);
                break;

            case 'move':
                _.swipeMove(event);
                break;

            case 'end':
                _.swipeEnd(event);
                break;

        }

    };

    Slick.prototype.swipeMove = function(event) {

        var _ = this,
            edgeWasHit = false,
            curLeft, swipeDirection, swipeLength, positionOffset, touches, verticalSwipeLength;

        touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;

        if (!_.dragging || _.scrolling || touches && touches.length !== 1) {
            return false;
        }

        curLeft = _.getLeft(_.currentSlide);

        _.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
        _.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

        _.touchObject.swipeLength = Math.round(Math.sqrt(
            Math.pow(_.touchObject.curX - _.touchObject.startX, 2)));

        verticalSwipeLength = Math.round(Math.sqrt(
            Math.pow(_.touchObject.curY - _.touchObject.startY, 2)));

        if (!_.options.verticalSwiping && !_.swiping && verticalSwipeLength > 4) {
            _.scrolling = true;
            return false;
        }

        if (_.options.verticalSwiping === true) {
            _.touchObject.swipeLength = verticalSwipeLength;
        }

        swipeDirection = _.swipeDirection();

        if (event.originalEvent !== undefined && _.touchObject.swipeLength > 4) {
            _.swiping = true;
            event.preventDefault();
        }

        positionOffset = (_.options.rtl === false ? 1 : -1) * (_.touchObject.curX > _.touchObject.startX ? 1 : -1);
        if (_.options.verticalSwiping === true) {
            positionOffset = _.touchObject.curY > _.touchObject.startY ? 1 : -1;
        }


        swipeLength = _.touchObject.swipeLength;

        _.touchObject.edgeHit = false;

        if (_.options.infinite === false) {
            if ((_.currentSlide === 0 && swipeDirection === 'right') || (_.currentSlide >= _.getDotCount() && swipeDirection === 'left')) {
                swipeLength = _.touchObject.swipeLength * _.options.edgeFriction;
                _.touchObject.edgeHit = true;
            }
        }

        if (_.options.vertical === false) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        } else {
            _.swipeLeft = curLeft + (swipeLength * (_.$list.height() / _.listWidth)) * positionOffset;
        }
        if (_.options.verticalSwiping === true) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        }

        if (_.options.fade === true || _.options.touchMove === false) {
            return false;
        }

        if (_.animating === true) {
            _.swipeLeft = null;
            return false;
        }

        _.setCSS(_.swipeLeft);

    };

    Slick.prototype.swipeStart = function(event) {

        var _ = this,
            touches;

        _.interrupted = true;

        if (_.touchObject.fingerCount !== 1 || _.slideCount <= _.options.slidesToShow) {
            _.touchObject = {};
            return false;
        }

        if (event.originalEvent !== undefined && event.originalEvent.touches !== undefined) {
            touches = event.originalEvent.touches[0];
        }

        _.touchObject.startX = _.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
        _.touchObject.startY = _.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;

        _.dragging = true;

    };

    Slick.prototype.unfilterSlides = Slick.prototype.slickUnfilter = function() {

        var _ = this;

        if (_.$slidesCache !== null) {

            _.unload();

            _.$slideTrack.children(this.options.slide).detach();

            _.$slidesCache.appendTo(_.$slideTrack);

            _.reinit();

        }

    };

    Slick.prototype.unload = function() {

        var _ = this;

        $('.slick-cloned', _.$slider).remove();

        if (_.$dots) {
            _.$dots.remove();
        }

        if (_.$prevArrow && _.htmlExpr.test(_.options.prevArrow)) {
            _.$prevArrow.remove();
        }

        if (_.$nextArrow && _.htmlExpr.test(_.options.nextArrow)) {
            _.$nextArrow.remove();
        }

        _.$slides
            .removeClass('slick-slide slick-active slick-visible slick-current')
            .attr('aria-hidden', 'true')
            .css('width', '');

    };

    Slick.prototype.unslick = function(fromBreakpoint) {

        var _ = this;
        _.$slider.trigger('unslick', [_, fromBreakpoint]);
        _.destroy();

    };

    Slick.prototype.updateArrows = function() {

        var _ = this,
            centerOffset;

        centerOffset = Math.floor(_.options.slidesToShow / 2);

        if (_.options.arrows === true &&
            _.slideCount > _.options.slidesToShow &&
            !_.options.infinite) {

            _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');
            _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            if (_.currentSlide === 0) {

                _.$prevArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            } else if (_.currentSlide >= _.slideCount - _.options.slidesToShow && _.options.centerMode === false) {

                _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            } else if (_.currentSlide >= _.slideCount - 1 && _.options.centerMode === true) {

                _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            }

        }

    };

    Slick.prototype.updateDots = function() {

        var _ = this;

        if (_.$dots !== null) {

            _.$dots
                .find('li')
                .removeClass('slick-active')
                .end();

            _.$dots
                .find('li')
                .eq(Math.floor(_.currentSlide / _.options.slidesToScroll))
                .addClass('slick-active');

        }

    };

    Slick.prototype.visibility = function() {

        var _ = this;

        if (_.options.autoplay) {

            if (document[_.hidden]) {

                _.interrupted = true;

            } else {

                _.interrupted = false;

            }

        }

    };

    $.fn.slick = function() {
        var _ = this,
            opt = arguments[0],
            args = Array.prototype.slice.call(arguments, 1),
            l = _.length,
            i,
            ret;
        for (i = 0; i < l; i++) {
            if (typeof opt == 'object' || typeof opt == 'undefined')
                _[i].slick = new Slick(_[i], opt);
            else
                ret = _[i].slick[opt].apply(_[i].slick, args);
            if (typeof ret != 'undefined') return ret;
        }
        return _;
    };
}));

/*
 * CSS3 Animate it
 * Copyright (c) 2014 Jack McCourt
 * https://github.com/kriegar/css3-animate-it
 * Version: 0.1.0
 * 
 * I utilise the jQuery.appear plugin within this javascript file so here is a link to that too
 * https://github.com/morr/jquery.appear
 *
 * I also utilise the jQuery.doTimeout plugin for the data-sequence functionality so here is a link back to them.
 * http://benalman.com/projects/jquery-dotimeout-plugin/
 */
(function($) {
    var selectors = [];

    var check_binded = false;
    var check_lock = false;
    var defaults = {
        interval: 250,
        force_process: false
    }
    var $window = $(window);

    var $prior_appeared;

    function process() {
        check_lock = false;
        for (var index = 0; index < selectors.length; index++) {
            var $appeared = $(selectors[index]).filter(function() {
                return $(this).is(':appeared');
            });

            $appeared.trigger('appear', [$appeared]);

            if ($prior_appeared) {

                var $disappeared = $prior_appeared.not($appeared);
                $disappeared.trigger('disappear', [$disappeared]);
            }
            $prior_appeared = $appeared;
        }
    }

    // "appeared" custom filter
    $.expr[':']['appeared'] = function(element) {
        var $element = $(element);
        if (!$element.is(':visible')) {
            return false;
        }

        var window_left = $window.scrollLeft();
        var window_top = $window.scrollTop();
        var offset = $element.offset();
        var left = offset.left;
        var top = offset.top;

        if (top + $element.height() >= window_top &&
            top - ($element.data('appear-top-offset') || 0) <= window_top + $window.height() &&
            left + $element.width() >= window_left &&
            left - ($element.data('appear-left-offset') || 0) <= window_left + $window.width()) {
            return true;
        } else {
            return false;
        }
    }

    $.fn.extend({
        // watching for element's appearance in browser viewport
        appear: function(options) {
            var opts = $.extend({}, defaults, options || {});
            var selector = this.selector || this;
            if (!check_binded) {
                var on_check = function() {
                    if (check_lock) {
                        return;
                    }
                    check_lock = true;

                    setTimeout(process, opts.interval);
                };

                $(window).scroll(on_check).resize(on_check);
                check_binded = true;
            }

            if (opts.force_process) {
                setTimeout(process, opts.interval);
            }
            selectors.push(selector);
            return $(selector);
        }
    });

    $.extend({
        // force elements's appearance check
        force_appear: function() {
            if (check_binded) {
                process();
                return true;
            };
            return false;
        }
    });
})(jQuery);



/*!
 * jQuery doTimeout: Like setTimeout, but better! - v1.0 - 3/3/2010
 * http://benalman.com/projects/jquery-dotimeout-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

// Script: jQuery doTimeout: Like setTimeout, but better!
//
// *Version: 1.0, Last updated: 3/3/2010*
// 
// Project Home - http://benalman.com/projects/jquery-dotimeout-plugin/
// GitHub       - http://github.com/cowboy/jquery-dotimeout/
// Source       - http://github.com/cowboy/jquery-dotimeout/raw/master/jquery.ba-dotimeout.js
// (Minified)   - http://github.com/cowboy/jquery-dotimeout/raw/master/jquery.ba-dotimeout.min.js (1.0kb)
// 
// About: License
// 
// Copyright (c) 2010 "Cowboy" Ben Alman,
// Dual licensed under the MIT and GPL licenses.
// http://benalman.com/about/license/
// 
// About: Examples
// 
// These working examples, complete with fully commented code, illustrate a few
// ways in which this plugin can be used.
// 
// Debouncing      - http://benalman.com/code/projects/jquery-dotimeout/examples/debouncing/
// Delays, Polling - http://benalman.com/code/projects/jquery-dotimeout/examples/delay-poll/
// Hover Intent    - http://benalman.com/code/projects/jquery-dotimeout/examples/hoverintent/
// 
// About: Support and Testing
// 
// Information about what version or versions of jQuery this plugin has been
// tested with, what browsers it has been tested in, and where the unit tests
// reside (so you can test it yourself).
// 
// jQuery Versions - 1.3.2, 1.4.2
// Browsers Tested - Internet Explorer 6-8, Firefox 2-3.6, Safari 3-4, Chrome 4-5, Opera 9.6-10.1.
// Unit Tests      - http://benalman.com/code/projects/jquery-dotimeout/unit/
// 
// About: Release History
// 
// 1.0 - (3/3/2010) Callback can now be a string, in which case it will call
//       the appropriate $.method or $.fn.method, depending on where .doTimeout
//       was called. Callback must now return `true` (not just a truthy value)
//       to poll.
// 0.4 - (7/15/2009) Made the "id" argument optional, some other minor tweaks
// 0.3 - (6/25/2009) Initial release

(function($) {
    '$:nomunge'; // Used by YUI compressor.

    var cache = {},

        // Reused internal string.
        doTimeout = 'doTimeout',

        // A convenient shortcut.
        aps = Array.prototype.slice;

    // Method: jQuery.doTimeout
    // 
    // Initialize, cancel, or force execution of a callback after a delay.
    // 
    // If delay and callback are specified, a doTimeout is initialized. The
    // callback will execute, asynchronously, after the delay. If an id is
    // specified, this doTimeout will override and cancel any existing doTimeout
    // with the same id. Any additional arguments will be passed into callback
    // when it is executed.
    // 
    // If the callback returns true, the doTimeout loop will execute again, after
    // the delay, creating a polling loop until the callback returns a non-true
    // value.
    // 
    // Note that if an id is not passed as the first argument, this doTimeout will
    // NOT be able to be manually canceled or forced. (for debouncing, be sure to
    // specify an id).
    // 
    // If id is specified, but delay and callback are not, the doTimeout will be
    // canceled without executing the callback. If force_mode is specified, the
    // callback will be executed, synchronously, but will only be allowed to
    // continue a polling loop if force_mode is true (provided the callback
    // returns true, of course). If force_mode is false, no polling loop will
    // continue, even if the callback returns true.
    // 
    // Usage:
    // 
    // > jQuery.doTimeout( [ id, ] delay, callback [, arg ... ] );
    // > jQuery.doTimeout( id [, force_mode ] );
    // 
    // Arguments:
    // 
    //  id - (String) An optional unique identifier for this doTimeout. If id is
    //    not specified, the doTimeout will NOT be able to be manually canceled or
    //    forced.
    //  delay - (Number) A zero-or-greater delay in milliseconds after which
    //    callback will be executed. 
    //  callback - (Function) A function to be executed after delay milliseconds.
    //  callback - (String) A jQuery method to be executed after delay
    //    milliseconds. This method will only poll if it explicitly returns
    //    true.
    //  force_mode - (Boolean) If true, execute that id's doTimeout callback
    //    immediately and synchronously, continuing any callback return-true
    //    polling loop. If false, execute the callback immediately and
    //    synchronously but do NOT continue a callback return-true polling loop.
    //    If omitted, cancel that id's doTimeout.
    // 
    // Returns:
    // 
    //  If force_mode is true, false or undefined and there is a
    //  yet-to-be-executed callback to cancel, true is returned, but if no
    //  callback remains to be executed, undefined is returned.

    $[doTimeout] = function() {
        return p_doTimeout.apply(window, [0].concat(aps.call(arguments)));
    };

    // Method: jQuery.fn.doTimeout
    // 
    // Initialize, cancel, or force execution of a callback after a delay.
    // Operates like <jQuery.doTimeout>, but the passed callback executes in the
    // context of the jQuery collection of elements, and the id is stored as data
    // on the first element in that collection.
    // 
    // If delay and callback are specified, a doTimeout is initialized. The
    // callback will execute, asynchronously, after the delay. If an id is
    // specified, this doTimeout will override and cancel any existing doTimeout
    // with the same id. Any additional arguments will be passed into callback
    // when it is executed.
    // 
    // If the callback returns true, the doTimeout loop will execute again, after
    // the delay, creating a polling loop until the callback returns a non-true
    // value.
    // 
    // Note that if an id is not passed as the first argument, this doTimeout will
    // NOT be able to be manually canceled or forced (for debouncing, be sure to
    // specify an id).
    // 
    // If id is specified, but delay and callback are not, the doTimeout will be
    // canceled without executing the callback. If force_mode is specified, the
    // callback will be executed, synchronously, but will only be allowed to
    // continue a polling loop if force_mode is true (provided the callback
    // returns true, of course). If force_mode is false, no polling loop will
    // continue, even if the callback returns true.
    // 
    // Usage:
    // 
    // > jQuery('selector').doTimeout( [ id, ] delay, callback [, arg ... ] );
    // > jQuery('selector').doTimeout( id [, force_mode ] );
    // 
    // Arguments:
    // 
    //  id - (String) An optional unique identifier for this doTimeout, stored as
    //    jQuery data on the element. If id is not specified, the doTimeout will
    //    NOT be able to be manually canceled or forced.
    //  delay - (Number) A zero-or-greater delay in milliseconds after which
    //    callback will be executed. 
    //  callback - (Function) A function to be executed after delay milliseconds.
    //  callback - (String) A jQuery.fn method to be executed after delay
    //    milliseconds. This method will only poll if it explicitly returns
    //    true (most jQuery.fn methods return a jQuery object, and not `true`,
    //    which allows them to be chained and prevents polling).
    //  force_mode - (Boolean) If true, execute that id's doTimeout callback
    //    immediately and synchronously, continuing any callback return-true
    //    polling loop. If false, execute the callback immediately and
    //    synchronously but do NOT continue a callback return-true polling loop.
    //    If omitted, cancel that id's doTimeout.
    // 
    // Returns:
    // 
    //  When creating a <jQuery.fn.doTimeout>, the initial jQuery collection of
    //  elements is returned. Otherwise, if force_mode is true, false or undefined
    //  and there is a yet-to-be-executed callback to cancel, true is returned,
    //  but if no callback remains to be executed, undefined is returned.

    $.fn[doTimeout] = function() {
        var args = aps.call(arguments),
            result = p_doTimeout.apply(this, [doTimeout + args[0]].concat(args));

        return typeof args[0] === 'number' || typeof args[1] === 'number' ?
            this :
            result;
    };

    function p_doTimeout(jquery_data_key) {
        var that = this,
            elem,
            data = {},

            // Allows the plugin to call a string callback method.
            method_base = jquery_data_key ? $.fn : $,

            // Any additional arguments will be passed to the callback.
            args = arguments,
            slice_args = 4,

            id = args[1],
            delay = args[2],
            callback = args[3];

        if (typeof id !== 'string') {
            slice_args--;

            id = jquery_data_key = 0;
            delay = args[1];
            callback = args[2];
        }

        // If id is passed, store a data reference either as .data on the first
        // element in a jQuery collection, or in the internal cache.
        if (jquery_data_key) { // Note: key is 'doTimeout' + id

            // Get id-object from the first element's data, otherwise initialize it to {}.
            elem = that.eq(0);
            elem.data(jquery_data_key, data = elem.data(jquery_data_key) || {});

        } else if (id) {
            // Get id-object from the cache, otherwise initialize it to {}.
            data = cache[id] || (cache[id] = {});
        }

        // Clear any existing timeout for this id.
        data.id && clearTimeout(data.id);
        delete data.id;

        // Clean up when necessary.
        function cleanup() {
            if (jquery_data_key) {
                elem.removeData(jquery_data_key);
            } else if (id) {
                delete cache[id];
            }
        };

        // Yes, there actually is a setTimeout call in here!
        function actually_setTimeout() {
            data.id = setTimeout(function() { data.fn(); }, delay);
        };

        if (callback) {
            // A callback (and delay) were specified. Store the callback reference for
            // possible later use, and then setTimeout.
            data.fn = function(no_polling_loop) {

                // If the callback value is a string, it is assumed to be the name of a
                // method on $ or $.fn depending on where doTimeout was executed.
                if (typeof callback === 'string') {
                    callback = method_base[callback];
                }

                callback.apply(that, aps.call(args, slice_args)) === true && !no_polling_loop

                    // Since the callback returned true, and we're not specifically
                    // canceling a polling loop, do it again!
                    ?
                    actually_setTimeout()

                    // Otherwise, clean up and quit.
                    :
                    cleanup();
            };

            // Set that timeout!
            actually_setTimeout();

        } else if (data.fn) {
            // No callback passed. If force_mode (delay) is true, execute the data.fn
            // callback immediately, continuing any callback return-true polling loop.
            // If force_mode is false, execute the data.fn callback immediately but do
            // NOT continue a callback return-true polling loop. If force_mode is
            // undefined, simply clean up. Since data.fn was still defined, whatever
            // was supposed to happen hadn't yet, so return true.
            delay === undefined ? cleanup() : data.fn(delay === false);
            return true;

        } else {
            // Since no callback was passed, and data.fn isn't defined, it looks like
            // whatever was supposed to happen already did. Clean up and quit!
            cleanup();
        }

    };

})(jQuery);




//CSS3 Animate-it
$('.animatedParent').appear();
$('.animatedClick').click(function() {
    var target = $(this).attr('data-target');


    if ($(this).attr('data-sequence') != undefined) {
        var firstId = $("." + target + ":first").attr('data-id');
        var lastId = $("." + target + ":last").attr('data-id');
        var number = firstId;

        //Add or remove the class
        if ($("." + target + "[data-id=" + number + "]").hasClass('go')) {
            $("." + target + "[data-id=" + number + "]").addClass('goAway');
            $("." + target + "[data-id=" + number + "]").removeClass('go');
        } else {
            $("." + target + "[data-id=" + number + "]").addClass('go');
            $("." + target + "[data-id=" + number + "]").removeClass('goAway');
        }
        number++;
        delay = Number($(this).attr('data-sequence'));
        $.doTimeout(delay, function() {
            console.log(lastId);

            //Add or remove the class
            if ($("." + target + "[data-id=" + number + "]").hasClass('go')) {
                $("." + target + "[data-id=" + number + "]").addClass('goAway');
                $("." + target + "[data-id=" + number + "]").removeClass('go');
            } else {
                $("." + target + "[data-id=" + number + "]").addClass('go');
                $("." + target + "[data-id=" + number + "]").removeClass('goAway');
            }

            //increment
            ++number;

            //continute looping till reached last ID
            if (number <= lastId) { return true; }
        });
    } else {
        if ($('.' + target).hasClass('go')) {
            $('.' + target).addClass('goAway');
            $('.' + target).removeClass('go');
        } else {
            $('.' + target).addClass('go');
            $('.' + target).removeClass('goAway');
        }
    }
});

$(document.body).on('appear', '.animatedParent', function(e, $affected) {
    var ele = $(this).find('.animated');
    var parent = $(this);


    if (parent.attr('data-sequence') != undefined) {

        var firstId = $(this).find('.animated:first').attr('data-id');
        var number = firstId;
        var lastId = $(this).find('.animated:last').attr('data-id');

        $(parent).find(".animated[data-id=" + number + "]").addClass('go');
        number++;
        delay = Number(parent.attr('data-sequence'));

        $.doTimeout(delay, function() {
            $(parent).find(".animated[data-id=" + number + "]").addClass('go');
            ++number;
            if (number <= lastId) { return true; }
        });
    } else {
        ele.addClass('go');
    }

});

$(document.body).on('disappear', '.animatedParent', function(e, $affected) {
    if (!$(this).hasClass('animateOnce')) {
        $(this).find('.animated').removeClass('go');
    }
});

$(window).on('load', function() {
    $.force_appear();
});


/*!
 * perfect-scrollbar v1.0.3
 * (c) 2017 Hyunje Jun
 * @license MIT
 */
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
        (global.PerfectScrollbar = factory());
}(this, (function() {
    'use strict';

    function get(element) {
        return getComputedStyle(element);
    }

    function set(element, obj) {
        for (var key in obj) {
            var val = obj[key];
            if (typeof val === 'number') {
                val = val + "px";
            }
            element.style[key] = val;
        }
        return element;
    }

    function div(className) {
        var div = document.createElement('div');
        div.className = className;
        return div;
    }

    var elMatches =
        Element.prototype.matches ||
        Element.prototype.webkitMatchesSelector ||
        Element.prototype.msMatchesSelector;

    function matches(element, query) {
        if (!elMatches) {
            throw new Error('No element matching method supported');
        }

        return elMatches.call(element, query);
    }

    function remove(element) {
        if (element.remove) {
            element.remove();
        } else {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
    }

    function queryChildren(element, selector) {
        return Array.prototype.filter.call(element.children, function(child) { return matches(child, selector); });
    }

    var EventElement = function EventElement(element) {
        this.element = element;
        this.handlers = {};
    };

    var prototypeAccessors$1 = { isEmpty: { configurable: true } };

    EventElement.prototype.bind = function bind(eventName, handler) {
        if (typeof this.handlers[eventName] === 'undefined') {
            this.handlers[eventName] = [];
        }
        this.handlers[eventName].push(handler);
        this.element.addEventListener(eventName, handler, false);
    };

    EventElement.prototype.unbind = function unbind(eventName, target) {
        var this$1 = this;

        this.handlers[eventName] = this.handlers[eventName].filter(function(handler) {
            if (target && handler !== target) {
                return true;
            }
            this$1.element.removeEventListener(eventName, handler, false);
            return false;
        });
    };

    EventElement.prototype.unbindAll = function unbindAll() {
        var this$1 = this;

        for (var name in this$1.handlers) {
            this$1.unbind(name);
        }
    };

    prototypeAccessors$1.isEmpty.get = function() {
        var this$1 = this;

        return Object.keys(this.handlers).every(
            function(key) { return this$1.handlers[key].length === 0; }
        );
    };

    Object.defineProperties(EventElement.prototype, prototypeAccessors$1);

    var EventManager = function EventManager() {
        this.eventElements = [];
    };

    EventManager.prototype.eventElement = function eventElement(element) {
        var ee = this.eventElements.filter(function(ee) { return ee.element === element; })[0];
        if (!ee) {
            ee = new EventElement(element);
            this.eventElements.push(ee);
        }
        return ee;
    };

    EventManager.prototype.bind = function bind(element, eventName, handler) {
        this.eventElement(element).bind(eventName, handler);
    };

    EventManager.prototype.unbind = function unbind(element, eventName, handler) {
        var ee = this.eventElement(element);
        ee.unbind(eventName, handler);

        if (ee.isEmpty) {
            // remove
            this.eventElements.splice(this.eventElements.indexOf(ee), 1);
        }
    };

    EventManager.prototype.unbindAll = function unbindAll() {
        this.eventElements.forEach(function(e) { return e.unbindAll(); });
        this.eventElements = [];
    };

    EventManager.prototype.once = function once(element, eventName, handler) {
        var ee = this.eventElement(element);
        var onceHandler = function(evt) {
            ee.unbind(eventName, onceHandler);
            handler(evt);
        };
        ee.bind(eventName, onceHandler);
    };

    var scrollingClassTimeout = { x: null, y: null };

    function setScrollingClass(element, y) {
        var cls = "ps--scrolling-" + y;

        if (element.classList.contains(cls)) {
            clearTimeout(scrollingClassTimeout[y]);
        } else {
            element.classList.add(cls);
        }

        // 1s for threshold
        scrollingClassTimeout[y] = setTimeout(
            function() { return element.classList.remove(cls); },
            1000
        );
    }

    function createEvent(name) {
        if (typeof window.CustomEvent === 'function') {
            return new CustomEvent(name);
        } else {
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(name, false, false, undefined);
            return evt;
        }
    }

    var updateScroll = function(i, axis, value) {
        var fields;
        if (axis === 'top') {
            fields = [
                'contentHeight',
                'containerHeight',
                'scrollTop',
                'y',
                'up',
                'down'
            ];
        } else if (axis === 'left') {
            fields = [
                'contentWidth',
                'containerWidth',
                'scrollLeft',
                'x',
                'left',
                'right'
            ];
        } else {
            throw new Error('A proper axis should be provided');
        }

        updateScroll$1(i, value, fields);
    };

    function updateScroll$1(
        i,
        value,
        ref
    ) {
        var contentHeight = ref[0];
        var containerHeight = ref[1];
        var scrollTop = ref[2];
        var y = ref[3];
        var up = ref[4];
        var down = ref[5];

        var element = i.element;

        var reach = 0; // -1 for start, +1 for end, 0 for none
        var mitigated = false;

        // don't allow negative scroll offset
        if (value <= 0) {
            value = 0;
            reach = -1;
        }

        // don't allow scroll past container
        if (value >= i[contentHeight] - i[containerHeight]) {
            value = i[contentHeight] - i[containerHeight];

            // mitigates rounding errors on non-subpixel scroll values
            if (value - element[scrollTop] <= 2) {
                mitigated = true;
            }

            reach = 1;
        }

        var diff = element[scrollTop] - value;

        if (diff) {
            element.dispatchEvent(createEvent(("ps-scroll-" + y)));

            if (diff > 0) {
                element.dispatchEvent(createEvent(("ps-scroll-" + up)));
            } else {
                element.dispatchEvent(createEvent(("ps-scroll-" + down)));
            }

            if (!mitigated) {
                element[scrollTop] = value;
            }

            if (reach) {
                element.dispatchEvent(
                    createEvent(("ps-" + y + "-reach-" + (reach > 0 ? 'end' : 'start')))
                );
            }

            setScrollingClass(element, y);
        }
    }

    function toInt(x) {
        return parseInt(x, 10) || 0;
    }

    function isEditable(el) {
        return (
            matches(el, 'input,[contenteditable]') ||
            matches(el, 'select,[contenteditable]') ||
            matches(el, 'textarea,[contenteditable]') ||
            matches(el, 'button,[contenteditable]')
        );
    }

    function outerWidth(element) {
        var styles = get(element);
        return (
            toInt(styles.width) +
            toInt(styles.paddingLeft) +
            toInt(styles.paddingRight) +
            toInt(styles.borderLeftWidth) +
            toInt(styles.borderRightWidth)
        );
    }

    var env = {
        isWebKit: document && 'WebkitAppearance' in document.documentElement.style,
        supportsTouch: window &&
            ('ontouchstart' in window ||
                (window.DocumentTouch && document instanceof window.DocumentTouch)),
        supportsIePointer: navigator && navigator.msMaxTouchPoints,
    };

    var updateGeometry = function(i) {
        var element = i.element;

        i.containerWidth = element.clientWidth;
        i.containerHeight = element.clientHeight;
        i.contentWidth = element.scrollWidth;
        i.contentHeight = element.scrollHeight;

        if (!element.contains(i.scrollbarXRail)) {
            // clean up and append
            queryChildren(element, '.ps__rail-x').forEach(function(el) { return remove(el); });
            element.appendChild(i.scrollbarXRail);
        }
        if (!element.contains(i.scrollbarYRail)) {
            // clean up and append
            queryChildren(element, '.ps__rail-y').forEach(function(el) { return remove(el); });
            element.appendChild(i.scrollbarYRail);
        }

        if (!i.settings.suppressScrollX &&
            i.containerWidth + i.settings.scrollXMarginOffset < i.contentWidth
        ) {
            i.scrollbarXActive = true;
            i.railXWidth = i.containerWidth - i.railXMarginWidth;
            i.railXRatio = i.containerWidth / i.railXWidth;
            i.scrollbarXWidth = getThumbSize(
                i,
                toInt(i.railXWidth * i.containerWidth / i.contentWidth)
            );
            i.scrollbarXLeft = toInt(
                (i.negativeScrollAdjustment + element.scrollLeft) *
                (i.railXWidth - i.scrollbarXWidth) /
                (i.contentWidth - i.containerWidth)
            );
        } else {
            i.scrollbarXActive = false;
        }

        if (!i.settings.suppressScrollY &&
            i.containerHeight + i.settings.scrollYMarginOffset < i.contentHeight
        ) {
            i.scrollbarYActive = true;
            i.railYHeight = i.containerHeight - i.railYMarginHeight;
            i.railYRatio = i.containerHeight / i.railYHeight;
            i.scrollbarYHeight = getThumbSize(
                i,
                toInt(i.railYHeight * i.containerHeight / i.contentHeight)
            );
            i.scrollbarYTop = toInt(
                element.scrollTop *
                (i.railYHeight - i.scrollbarYHeight) /
                (i.contentHeight - i.containerHeight)
            );
        } else {
            i.scrollbarYActive = false;
        }

        if (i.scrollbarXLeft >= i.railXWidth - i.scrollbarXWidth) {
            i.scrollbarXLeft = i.railXWidth - i.scrollbarXWidth;
        }
        if (i.scrollbarYTop >= i.railYHeight - i.scrollbarYHeight) {
            i.scrollbarYTop = i.railYHeight - i.scrollbarYHeight;
        }

        updateCss(element, i);

        if (i.scrollbarXActive) {
            element.classList.add('ps--active-x');
        } else {
            element.classList.remove('ps--active-x');
            i.scrollbarXWidth = 0;
            i.scrollbarXLeft = 0;
            updateScroll(i, 'left', 0);
        }
        if (i.scrollbarYActive) {
            element.classList.add('ps--active-y');
        } else {
            element.classList.remove('ps--active-y');
            i.scrollbarYHeight = 0;
            i.scrollbarYTop = 0;
            updateScroll(i, 'top', 0);
        }
    };

    function getThumbSize(i, thumbSize) {
        if (i.settings.minScrollbarLength) {
            thumbSize = Math.max(thumbSize, i.settings.minScrollbarLength);
        }
        if (i.settings.maxScrollbarLength) {
            thumbSize = Math.min(thumbSize, i.settings.maxScrollbarLength);
        }
        return thumbSize;
    }

    function updateCss(element, i) {
        var xRailOffset = { width: i.railXWidth };
        if (i.isRtl) {
            xRailOffset.left =
                i.negativeScrollAdjustment +
                element.scrollLeft +
                i.containerWidth -
                i.contentWidth;
        } else {
            xRailOffset.left = element.scrollLeft;
        }
        if (i.isScrollbarXUsingBottom) {
            xRailOffset.bottom = i.scrollbarXBottom - element.scrollTop;
        } else {
            xRailOffset.top = i.scrollbarXTop + element.scrollTop;
        }
        set(i.scrollbarXRail, xRailOffset);

        var yRailOffset = { top: element.scrollTop, height: i.railYHeight };
        if (i.isScrollbarYUsingRight) {
            if (i.isRtl) {
                yRailOffset.right =
                    i.contentWidth -
                    (i.negativeScrollAdjustment + element.scrollLeft) -
                    i.scrollbarYRight -
                    i.scrollbarYOuterWidth;
            } else {
                yRailOffset.right = i.scrollbarYRight - element.scrollLeft;
            }
        } else {
            if (i.isRtl) {
                yRailOffset.left =
                    i.negativeScrollAdjustment +
                    element.scrollLeft +
                    i.containerWidth * 2 -
                    i.contentWidth -
                    i.scrollbarYLeft -
                    i.scrollbarYOuterWidth;
            } else {
                yRailOffset.left = i.scrollbarYLeft + element.scrollLeft;
            }
        }
        set(i.scrollbarYRail, yRailOffset);

        set(i.scrollbarX, {
            left: i.scrollbarXLeft,
            width: i.scrollbarXWidth - i.railBorderXWidth,
        });
        set(i.scrollbarY, {
            top: i.scrollbarYTop,
            height: i.scrollbarYHeight - i.railBorderYWidth,
        });
    }

    var clickRail = function(i) {
        var element = i.element;

        i.event.bind(i.scrollbarY, 'mousedown', function(e) { return e.stopPropagation(); });
        i.event.bind(i.scrollbarYRail, 'mousedown', function(e) {
            var positionTop =
                e.pageY -
                window.pageYOffset -
                i.scrollbarYRail.getBoundingClientRect().top;
            var direction = positionTop > i.scrollbarYTop ? 1 : -1;

            updateScroll(i, 'top', element.scrollTop + direction * i.containerHeight);
            updateGeometry(i);

            e.stopPropagation();
        });

        i.event.bind(i.scrollbarX, 'mousedown', function(e) { return e.stopPropagation(); });
        i.event.bind(i.scrollbarXRail, 'mousedown', function(e) {
            var positionLeft =
                e.pageX -
                window.pageXOffset -
                i.scrollbarXRail.getBoundingClientRect().left;
            var direction = positionLeft > i.scrollbarXLeft ? 1 : -1;

            updateScroll(i, 'left', element.scrollLeft + direction * i.containerWidth);
            updateGeometry(i);

            e.stopPropagation();
        });
    };

    var dragThumb = function(i) {
        bindMouseScrollHandler(i, [
            'containerWidth',
            'contentWidth',
            'pageX',
            'railXWidth',
            'scrollbarX',
            'scrollbarXWidth',
            'scrollLeft',
            'left'
        ]);
        bindMouseScrollHandler(i, [
            'containerHeight',
            'contentHeight',
            'pageY',
            'railYHeight',
            'scrollbarY',
            'scrollbarYHeight',
            'scrollTop',
            'top'
        ]);
    };

    function bindMouseScrollHandler(
        i,
        ref
    ) {
        var containerHeight = ref[0];
        var contentHeight = ref[1];
        var pageY = ref[2];
        var railYHeight = ref[3];
        var scrollbarY = ref[4];
        var scrollbarYHeight = ref[5];
        var scrollTop = ref[6];
        var top = ref[7];

        var element = i.element;

        var startingScrollTop = null;
        var startingMousePageY = null;
        var scrollBy = null;

        function mouseMoveHandler(e) {
            updateScroll(
                i,
                top,
                startingScrollTop + scrollBy * (e[pageY] - startingMousePageY)
            );
            updateGeometry(i);

            e.stopPropagation();
            e.preventDefault();
        }

        function mouseUpHandler() {
            i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
        }

        i.event.bind(i[scrollbarY], 'mousedown', function(e) {
            startingScrollTop = element[scrollTop];
            startingMousePageY = e[pageY];
            scrollBy =
                (i[contentHeight] - i[containerHeight]) /
                (i[railYHeight] - i[scrollbarYHeight]);

            i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
            i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler);

            e.stopPropagation();
            e.preventDefault();
        });
    }

    var keyboard = function(i) {
        var element = i.element;

        var elementHovered = function() { return matches(element, ':hover'); };
        var scrollbarFocused = function() { return matches(i.scrollbarX, ':focus') || matches(i.scrollbarY, ':focus'); };

        function shouldPreventDefault(deltaX, deltaY) {
            var scrollTop = element.scrollTop;
            if (deltaX === 0) {
                if (!i.scrollbarYActive) {
                    return false;
                }
                if (
                    (scrollTop === 0 && deltaY > 0) ||
                    (scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0)
                ) {
                    return !i.settings.wheelPropagation;
                }
            }

            var scrollLeft = element.scrollLeft;
            if (deltaY === 0) {
                if (!i.scrollbarXActive) {
                    return false;
                }
                if (
                    (scrollLeft === 0 && deltaX < 0) ||
                    (scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0)
                ) {
                    return !i.settings.wheelPropagation;
                }
            }
            return true;
        }

        i.event.bind(i.ownerDocument, 'keydown', function(e) {
            if (
                (e.isDefaultPrevented && e.isDefaultPrevented()) ||
                e.defaultPrevented
            ) {
                return;
            }

            if (!elementHovered() && !scrollbarFocused()) {
                return;
            }

            var activeElement = document.activeElement ?
                document.activeElement :
                i.ownerDocument.activeElement;
            if (activeElement) {
                if (activeElement.tagName === 'IFRAME') {
                    activeElement = activeElement.contentDocument.activeElement;
                } else {
                    // go deeper if element is a webcomponent
                    while (activeElement.shadowRoot) {
                        activeElement = activeElement.shadowRoot.activeElement;
                    }
                }
                if (isEditable(activeElement)) {
                    return;
                }
            }

            var deltaX = 0;
            var deltaY = 0;

            switch (e.which) {
                case 37: // left
                    if (e.metaKey) {
                        deltaX = -i.contentWidth;
                    } else if (e.altKey) {
                        deltaX = -i.containerWidth;
                    } else {
                        deltaX = -30;
                    }
                    break;
                case 38: // up
                    if (e.metaKey) {
                        deltaY = i.contentHeight;
                    } else if (e.altKey) {
                        deltaY = i.containerHeight;
                    } else {
                        deltaY = 30;
                    }
                    break;
                case 39: // right
                    if (e.metaKey) {
                        deltaX = i.contentWidth;
                    } else if (e.altKey) {
                        deltaX = i.containerWidth;
                    } else {
                        deltaX = 30;
                    }
                    break;
                case 40: // down
                    if (e.metaKey) {
                        deltaY = -i.contentHeight;
                    } else if (e.altKey) {
                        deltaY = -i.containerHeight;
                    } else {
                        deltaY = -30;
                    }
                    break;
                case 32: // space bar
                    if (e.shiftKey) {
                        deltaY = i.containerHeight;
                    } else {
                        deltaY = -i.containerHeight;
                    }
                    break;
                case 33: // page up
                    deltaY = i.containerHeight;
                    break;
                case 34: // page down
                    deltaY = -i.containerHeight;
                    break;
                case 36: // home
                    deltaY = i.contentHeight;
                    break;
                case 35: // end
                    deltaY = -i.contentHeight;
                    break;
                default:
                    return;
            }

            if (i.settings.suppressScrollX && deltaX !== 0) {
                return;
            }
            if (i.settings.suppressScrollY && deltaY !== 0) {
                return;
            }

            updateScroll(i, 'top', element.scrollTop - deltaY);
            updateScroll(i, 'left', element.scrollLeft + deltaX);
            updateGeometry(i);

            if (shouldPreventDefault(deltaX, deltaY)) {
                e.preventDefault();
            }
        });
    };

    var childConsumeClass = 'ps__child--consume';

    var wheel = function(i) {
        var element = i.element;

        function shouldPreventDefault(deltaX, deltaY) {
            var scrollTop = element.scrollTop;
            if (deltaX === 0) {
                if (!i.scrollbarYActive) {
                    return false;
                }
                if (
                    (scrollTop === 0 && deltaY > 0) ||
                    (scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0)
                ) {
                    return !i.settings.wheelPropagation;
                }
            }

            var scrollLeft = element.scrollLeft;
            if (deltaY === 0) {
                if (!i.scrollbarXActive) {
                    return false;
                }
                if (
                    (scrollLeft === 0 && deltaX < 0) ||
                    (scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0)
                ) {
                    return !i.settings.wheelPropagation;
                }
            }
            return true;
        }

        function getDeltaFromEvent(e) {
            var deltaX = e.deltaX;
            var deltaY = -1 * e.deltaY;

            if (typeof deltaX === 'undefined' || typeof deltaY === 'undefined') {
                // OS X Safari
                deltaX = -1 * e.wheelDeltaX / 6;
                deltaY = e.wheelDeltaY / 6;
            }

            if (e.deltaMode && e.deltaMode === 1) {
                // Firefox in deltaMode 1: Line scrolling
                deltaX *= 10;
                deltaY *= 10;
            }

            if (deltaX !== deltaX && deltaY !== deltaY /* NaN checks */ ) {
                // IE in some mouse drivers
                deltaX = 0;
                deltaY = e.wheelDelta;
            }

            if (e.shiftKey) {
                // reverse axis with shift key
                return [-deltaY, -deltaX];
            }
            return [deltaX, deltaY];
        }

        function shouldBeConsumedByChild(target, deltaX, deltaY) {
            // FIXME: this is a workaround for <select> issue in FF and IE #571
            if (!env.isWebKit && element.querySelector('select:focus')) {
                return true;
            }

            if (!element.contains(target)) {
                return false;
            }

            var cursor = target;

            while (cursor && cursor !== element) {
                if (cursor.classList.contains(childConsumeClass)) {
                    return true;
                }

                var style = get(cursor);
                var overflow = [style.overflow, style.overflowX, style.overflowY].join(
                    ''
                );

                // if scrollable
                if (overflow.match(/(scroll|auto)/)) {
                    var maxScrollTop = cursor.scrollHeight - cursor.clientHeight;
                    if (maxScrollTop > 0) {
                        if (!(cursor.scrollTop === 0 && deltaY > 0) &&
                            !(cursor.scrollTop === maxScrollTop && deltaY < 0)
                        ) {
                            return true;
                        }
                    }
                    var maxScrollLeft = cursor.scrollLeft - cursor.clientWidth;
                    if (maxScrollLeft > 0) {
                        if (!(cursor.scrollLeft === 0 && deltaX < 0) &&
                            !(cursor.scrollLeft === maxScrollLeft && deltaX > 0)
                        ) {
                            return true;
                        }
                    }
                }

                cursor = cursor.parentNode;
            }

            return false;
        }

        function mousewheelHandler(e) {
            var ref = getDeltaFromEvent(e);
            var deltaX = ref[0];
            var deltaY = ref[1];

            if (shouldBeConsumedByChild(e.target, deltaX, deltaY)) {
                return;
            }

            var shouldPrevent = false;
            if (!i.settings.useBothWheelAxes) {
                // deltaX will only be used for horizontal scrolling and deltaY will
                // only be used for vertical scrolling - this is the default
                updateScroll(
                    i,
                    'top',
                    element.scrollTop - deltaY * i.settings.wheelSpeed
                );
                updateScroll(
                    i,
                    'left',
                    element.scrollLeft + deltaX * i.settings.wheelSpeed
                );
            } else if (i.scrollbarYActive && !i.scrollbarXActive) {
                // only vertical scrollbar is active and useBothWheelAxes option is
                // active, so let's scroll vertical bar using both mouse wheel axes
                if (deltaY) {
                    updateScroll(
                        i,
                        'top',
                        element.scrollTop - deltaY * i.settings.wheelSpeed
                    );
                } else {
                    updateScroll(
                        i,
                        'top',
                        element.scrollTop + deltaX * i.settings.wheelSpeed
                    );
                }
                shouldPrevent = true;
            } else if (i.scrollbarXActive && !i.scrollbarYActive) {
                // useBothWheelAxes and only horizontal bar is active, so use both
                // wheel axes for horizontal bar
                if (deltaX) {
                    updateScroll(
                        i,
                        'left',
                        element.scrollLeft + deltaX * i.settings.wheelSpeed
                    );
                } else {
                    updateScroll(
                        i,
                        'left',
                        element.scrollLeft - deltaY * i.settings.wheelSpeed
                    );
                }
                shouldPrevent = true;
            }

            updateGeometry(i);

            shouldPrevent = shouldPrevent || shouldPreventDefault(deltaX, deltaY);
            if (shouldPrevent) {
                e.stopPropagation();
                e.preventDefault();
            }
        }

        if (typeof window.onwheel !== 'undefined') {
            i.event.bind(element, 'wheel', mousewheelHandler);
        } else if (typeof window.onmousewheel !== 'undefined') {
            i.event.bind(element, 'mousewheel', mousewheelHandler);
        }
    };

    var touch = function(i) {
        if (!env.supportsTouch && !env.supportsIePointer) {
            return;
        }

        var element = i.element;

        function shouldStopOrPrevent(deltaX, deltaY) {
            var scrollTop = element.scrollTop;
            var scrollLeft = element.scrollLeft;
            var magnitudeX = Math.abs(deltaX);
            var magnitudeY = Math.abs(deltaY);

            if (magnitudeY > magnitudeX) {
                // user is perhaps trying to swipe up/down the page

                if (
                    (deltaY < 0 && scrollTop === i.contentHeight - i.containerHeight) ||
                    (deltaY > 0 && scrollTop === 0)
                ) {
                    // set prevent for mobile Chrome refresh
                    return {
                        stop: !i.settings.swipePropagation,
                        prevent: window.scrollY === 0,
                    };
                }
            } else if (magnitudeX > magnitudeY) {
                // user is perhaps trying to swipe left/right across the page

                if (
                    (deltaX < 0 && scrollLeft === i.contentWidth - i.containerWidth) ||
                    (deltaX > 0 && scrollLeft === 0)
                ) {
                    return { stop: !i.settings.swipePropagation, prevent: true };
                }
            }

            return { stop: true, prevent: true };
        }

        function applyTouchMove(differenceX, differenceY) {
            updateScroll(i, 'top', element.scrollTop - differenceY);
            updateScroll(i, 'left', element.scrollLeft - differenceX);

            updateGeometry(i);
        }

        var startOffset = {};
        var startTime = 0;
        var speed = {};
        var easingLoop = null;
        var inGlobalTouch = false;
        var inLocalTouch = false;

        function globalTouchStart() {
            inGlobalTouch = true;
        }

        function globalTouchEnd() {
            inGlobalTouch = false;
        }

        function getTouch(e) {
            if (e.targetTouches) {
                return e.targetTouches[0];
            } else {
                // Maybe IE pointer
                return e;
            }
        }

        function shouldHandle(e) {
            if (e.pointerType && e.pointerType === 'pen' && e.buttons === 0) {
                return false;
            }
            if (e.targetTouches && e.targetTouches.length === 1) {
                return true;
            }
            if (
                e.pointerType &&
                e.pointerType !== 'mouse' &&
                e.pointerType !== e.MSPOINTER_TYPE_MOUSE
            ) {
                return true;
            }
            return false;
        }

        function touchStart(e) {
            if (!shouldHandle(e)) {
                return;
            }

            inLocalTouch = true;

            var touch = getTouch(e);

            startOffset.pageX = touch.pageX;
            startOffset.pageY = touch.pageY;

            startTime = new Date().getTime();

            if (easingLoop !== null) {
                clearInterval(easingLoop);
            }

            e.stopPropagation();
        }

        function touchMove(e) {
            if (!inLocalTouch && i.settings.swipePropagation) {
                touchStart(e);
            }
            if (!inGlobalTouch && inLocalTouch && shouldHandle(e)) {
                var touch = getTouch(e);

                var currentOffset = { pageX: touch.pageX, pageY: touch.pageY };

                var differenceX = currentOffset.pageX - startOffset.pageX;
                var differenceY = currentOffset.pageY - startOffset.pageY;

                applyTouchMove(differenceX, differenceY);
                startOffset = currentOffset;

                var currentTime = new Date().getTime();

                var timeGap = currentTime - startTime;
                if (timeGap > 0) {
                    speed.x = differenceX / timeGap;
                    speed.y = differenceY / timeGap;
                    startTime = currentTime;
                }

                var ref = shouldStopOrPrevent(differenceX, differenceY);
                var stop = ref.stop;
                var prevent = ref.prevent;
                if (stop) { e.stopPropagation(); }
                if (prevent) { e.preventDefault(); }
            }
        }

        function touchEnd() {
            if (!inGlobalTouch && inLocalTouch) {
                inLocalTouch = false;

                if (i.settings.swipeEasing) {
                    clearInterval(easingLoop);
                    easingLoop = setInterval(function() {
                        if (i.isInitialized) {
                            clearInterval(easingLoop);
                            return;
                        }

                        if (!speed.x && !speed.y) {
                            clearInterval(easingLoop);
                            return;
                        }

                        if (Math.abs(speed.x) < 0.01 && Math.abs(speed.y) < 0.01) {
                            clearInterval(easingLoop);
                            return;
                        }

                        applyTouchMove(speed.x * 30, speed.y * 30);

                        speed.x *= 0.8;
                        speed.y *= 0.8;
                    }, 10);
                }
            }
        }

        if (env.supportsTouch) {
            i.event.bind(window, 'touchstart', globalTouchStart);
            i.event.bind(window, 'touchend', globalTouchEnd);
            i.event.bind(element, 'touchstart', touchStart);
            i.event.bind(element, 'touchmove', touchMove);
            i.event.bind(element, 'touchend', touchEnd);
        } else if (env.supportsIePointer) {
            if (window.PointerEvent) {
                i.event.bind(window, 'pointerdown', globalTouchStart);
                i.event.bind(window, 'pointerup', globalTouchEnd);
                i.event.bind(element, 'pointerdown', touchStart);
                i.event.bind(element, 'pointermove', touchMove);
                i.event.bind(element, 'pointerup', touchEnd);
            } else if (window.MSPointerEvent) {
                i.event.bind(window, 'MSPointerDown', globalTouchStart);
                i.event.bind(window, 'MSPointerUp', globalTouchEnd);
                i.event.bind(element, 'MSPointerDown', touchStart);
                i.event.bind(element, 'MSPointerMove', touchMove);
                i.event.bind(element, 'MSPointerUp', touchEnd);
            }
        }
    };

    var defaultSettings = function() {
        return ({
            handlers: ['click-rail', 'drag-thumb', 'keyboard', 'wheel', 'touch'],
            maxScrollbarLength: null,
            minScrollbarLength: null,
            scrollXMarginOffset: 0,
            scrollYMarginOffset: 0,
            suppressScrollX: false,
            suppressScrollY: false,
            swipePropagation: true,
            swipeEasing: true,
            useBothWheelAxes: false,
            wheelPropagation: false,
            wheelSpeed: 1,
        });
    };

    var handlers = {
        'click-rail': clickRail,
        'drag-thumb': dragThumb,
        keyboard: keyboard,
        wheel: wheel,
        touch: touch,
    };

    var psClassName = 'ps';

    var PerfectScrollbar = function PerfectScrollbar(element, userSettings) {
        var this$1 = this;
        if (userSettings === void 0) userSettings = {};

        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element || !element.nodeName) {
            throw new Error('no element is specified to initialize PerfectScrollbar');
        }

        this.element = element;

        element.classList.add(psClassName);

        this.settings = defaultSettings();
        for (var key in userSettings) {
            this$1.settings[key] = userSettings[key];
        }

        this.containerWidth = null;
        this.containerHeight = null;
        this.contentWidth = null;
        this.contentHeight = null;

        var focus = function() { return element.classList.add('ps--focus'); };
        var blur = function() { return element.classList.remove('ps--focus'); };

        this.isRtl = get(element).direction === 'rtl';
        this.isNegativeScroll = (function() {
            var originalScrollLeft = element.scrollLeft;
            var result = null;
            element.scrollLeft = -1;
            result = element.scrollLeft < 0;
            element.scrollLeft = originalScrollLeft;
            return result;
        })();
        this.negativeScrollAdjustment = this.isNegativeScroll ?
            element.scrollWidth - element.clientWidth :
            0;
        this.event = new EventManager();
        this.ownerDocument = element.ownerDocument || document;

        this.scrollbarXRail = div('ps__rail-x');
        element.appendChild(this.scrollbarXRail);
        this.scrollbarX = div('ps__thumb-x');
        this.scrollbarXRail.appendChild(this.scrollbarX);
        this.scrollbarX.setAttribute('tabindex', 0);
        this.event.bind(this.scrollbarX, 'focus', focus);
        this.event.bind(this.scrollbarX, 'blur', blur);
        this.scrollbarXActive = null;
        this.scrollbarXWidth = null;
        this.scrollbarXLeft = null;
        var railXStyle = get(this.scrollbarXRail);
        this.scrollbarXBottom = parseInt(railXStyle.bottom, 10);
        if (isNaN(this.scrollbarXBottom)) {
            this.isScrollbarXUsingBottom = false;
            this.scrollbarXTop = toInt(railXStyle.top);
        } else {
            this.isScrollbarXUsingBottom = true;
        }
        this.railBorderXWidth =
            toInt(railXStyle.borderLeftWidth) + toInt(railXStyle.borderRightWidth);
        // Set rail to display:block to calculate margins
        set(this.scrollbarXRail, { display: 'block' });
        this.railXMarginWidth =
            toInt(railXStyle.marginLeft) + toInt(railXStyle.marginRight);
        set(this.scrollbarXRail, { display: '' });
        this.railXWidth = null;
        this.railXRatio = null;

        this.scrollbarYRail = div('ps__rail-y');
        element.appendChild(this.scrollbarYRail);
        this.scrollbarY = div('ps__thumb-y');
        this.scrollbarYRail.appendChild(this.scrollbarY);
        this.scrollbarY.setAttribute('tabindex', 0);
        this.event.bind(this.scrollbarY, 'focus', focus);
        this.event.bind(this.scrollbarY, 'blur', blur);
        this.scrollbarYActive = null;
        this.scrollbarYHeight = null;
        this.scrollbarYTop = null;
        var railYStyle = get(this.scrollbarYRail);
        this.scrollbarYRight = parseInt(railYStyle.right, 10);
        if (isNaN(this.scrollbarYRight)) {
            this.isScrollbarYUsingRight = false;
            this.scrollbarYLeft = toInt(railYStyle.left);
        } else {
            this.isScrollbarYUsingRight = true;
        }
        this.scrollbarYOuterWidth = this.isRtl ? outerWidth(this.scrollbarY) : null;
        this.railBorderYWidth =
            toInt(railYStyle.borderTopWidth) + toInt(railYStyle.borderBottomWidth);
        set(this.scrollbarYRail, { display: 'block' });
        this.railYMarginHeight =
            toInt(railYStyle.marginTop) + toInt(railYStyle.marginBottom);
        set(this.scrollbarYRail, { display: '' });
        this.railYHeight = null;
        this.railYRatio = null;

        this.settings.handlers.forEach(function(handlerName) { return handlers[handlerName](this$1); });

        this.event.bind(this.element, 'scroll', function() { return updateGeometry(this$1); });
        updateGeometry(this);
    };

    var prototypeAccessors = { isInitialized: { configurable: true } };

    prototypeAccessors.isInitialized.get = function() {
        return this.element.classList.contains(psClassName);
    };

    PerfectScrollbar.prototype.update = function update() {
        if (!this.isInitialized) {
            return;
        }

        // Recalcuate negative scrollLeft adjustment
        this.negativeScrollAdjustment = this.isNegativeScroll ?
            this.element.scrollWidth - this.element.clientWidth :
            0;

        // Recalculate rail margins
        set(this.scrollbarXRail, { display: 'block' });
        set(this.scrollbarYRail, { display: 'block' });
        this.railXMarginWidth =
            toInt(get(this.scrollbarXRail).marginLeft) +
            toInt(get(this.scrollbarXRail).marginRight);
        this.railYMarginHeight =
            toInt(get(this.scrollbarYRail).marginTop) +
            toInt(get(this.scrollbarYRail).marginBottom);

        // Hide scrollbars not to affect scrollWidth and scrollHeight
        set(this.scrollbarXRail, { display: 'none' });
        set(this.scrollbarYRail, { display: 'none' });

        updateGeometry(this);

        // Update top/left scroll to trigger events
        updateScroll(this, 'top', this.element.scrollTop);
        updateScroll(this, 'left', this.element.scrollLeft);

        set(this.scrollbarXRail, { display: '' });
        set(this.scrollbarYRail, { display: '' });
    };

    PerfectScrollbar.prototype.destroy = function destroy() {
        if (!this.isInitialized) {
            return;
        }

        this.event.unbindAll();
        remove(this.scrollbarX);
        remove(this.scrollbarY);
        remove(this.scrollbarXRail);
        remove(this.scrollbarYRail);
        this.removePsClasses();

        // unset elements
        this.element = null;
        this.scrollbarX = null;
        this.scrollbarY = null;
        this.scrollbarXRail = null;
        this.scrollbarYRail = null;
    };

    PerfectScrollbar.prototype.removePsClasses = function removePsClasses() {
        var this$1 = this;

        for (var i = 0; i < this.element.classList.length; i++) {
            var className = this$1.element.classList[i];
            if (className === 'ps' || className.indexOf('ps-') === 0) {
                this$1.element.classList.remove(className);
            }
        }
    };

    Object.defineProperties(PerfectScrollbar.prototype, prototypeAccessors);

    return PerfectScrollbar;

})));

// ==================================================
// fancyBox v3.1.28
//
// Licensed GPLv3 for open source use
// or fancyBox Commercial License for commercial use
//
// http://fancyapps.com/fancybox/
// Copyright 2017 fancyApps
//
// ==================================================
;
(function(window, document, $, undefined) {
    'use strict';

    // If there's no jQuery, fancyBox can't work
    // =========================================

    if (!$) {
        return;
    }

    // Check if fancyBox is already initialized
    // ========================================

    if ($.fn.fancybox) {

        $.error('fancyBox already initialized');

        return;
    }

    // Private default settings
    // ========================

    var defaults = {

        // Enable infinite gallery navigation
        loop: false,

        // Space around image, ignored if zoomed-in or viewport width is smaller than 800px
        margin: [44, 0],

        // Horizontal space between slides
        gutter: 50,

        // Enable keyboard navigation
        keyboard: true,

        // Should display navigation arrows at the screen edges
        arrows: true,

        // Should display infobar (counter and arrows at the top)
        infobar: false,

        // Should display toolbar (buttons at the top)
        toolbar: true,

        // What buttons should appear in the top right corner.
        // Buttons will be created using templates from `btnTpl` option
        // and they will be placed into toolbar (class="fancybox-toolbar"` element)
        buttons: [
            'slideShow',
            'fullScreen',
            'thumbs',
            'close'
        ],

        // Detect "idle" time in seconds
        idleTime: 4,

        // Should display buttons at top right corner of the content
        // If 'auto' - they will be created for content having type 'html', 'inline' or 'ajax'
        // Use template from `btnTpl.smallBtn` for customization
        smallBtn: 'auto',

        // Disable right-click and use simple image protection for images
        protect: false,

        // Shortcut to make content "modal" - disable keyboard navigtion, hide buttons, etc
        modal: false,

        image: {

            // Wait for images to load before displaying
            // Requires predefined image dimensions
            // If 'auto' - will zoom in thumbnail if 'width' and 'height' attributes are found
            preload: "auto",

        },

        ajax: {

            // Object containing settings for ajax request
            settings: {

                // This helps to indicate that request comes from the modal
                // Feel free to change naming
                data: {
                    fancybox: true
                }
            }

        },

        iframe: {

            // Iframe template
            tpl: '<iframe id="fancybox-frame{rnd}" name="fancybox-frame{rnd}" class="fancybox-iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen allowtransparency="true" src=""></iframe>',

            // Preload iframe before displaying it
            // This allows to calculate iframe content width and height
            // (note: Due to "Same Origin Policy", you can't get cross domain data).
            preload: true,

            // Custom CSS styling for iframe wrapping element
            // You can use this to set custom iframe dimensions
            css: {},

            // Iframe tag attributes
            attr: {
                scrolling: 'auto'
            }

        },

        // Open/close animation type
        // Possible values:
        //   false            - disable
        //   "zoom"           - zoom images from/to thumbnail
        //   "fade"
        //   "zoom-in-out"
        //
        animationEffect: "zoom",

        // Duration in ms for open/close animation
        animationDuration: 366,

        // Should image change opacity while zooming
        // If opacity is 'auto', then opacity will be changed if image and thumbnail have different aspect ratios
        zoomOpacity: 'auto',

        // Transition effect between slides
        //
        // Possible values:
        //   false            - disable
        //   "fade'
        //   "slide'
        //   "circular'
        //   "tube'
        //   "zoom-in-out'
        //   "rotate'
        //
        transitionEffect: "fade",

        // Duration in ms for transition animation
        transitionDuration: 366,

        // Custom CSS class for slide element
        slideClass: '',

        // Custom CSS class for layout
        baseClass: '',

        // Base template for layout
        baseTpl: '<div class="fancybox-container" role="dialog" tabindex="-1">' +
            '<div class="fancybox-bg"></div>' +
            '<div class="fancybox-inner">' +
            '<div class="fancybox-infobar">' +
            '<button data-fancybox-prev title="{{PREV}}" class="fancybox-button fancybox-button--left"></button>' +
            '<div class="fancybox-infobar__body">' +
            '<span data-fancybox-index></span>&nbsp;/&nbsp;<span data-fancybox-count></span>' +
            '</div>' +
            '<button data-fancybox-next title="{{NEXT}}" class="fancybox-button fancybox-button--right"></button>' +
            '</div>' +
            '<div class="fancybox-toolbar">' +
            '{{BUTTONS}}' +
            '</div>' +
            '<div class="fancybox-navigation">' +
            '<button data-fancybox-prev title="{{PREV}}" class="fancybox-arrow fancybox-arrow--left" />' +
            '<button data-fancybox-next title="{{NEXT}}" class="fancybox-arrow fancybox-arrow--right" />' +
            '</div>' +
            '<div class="fancybox-stage"></div>' +
            '<div class="fancybox-caption-wrap">' +
            '<div class="fancybox-caption"></div>' +
            '</div>' +
            '</div>' +
            '</div>',

        // Loading indicator template
        spinnerTpl: '<div class="fancybox-loading"></div>',

        // Error message template
        errorTpl: '<div class="fancybox-error"><p>{{ERROR}}<p></div>',

        btnTpl: {
            slideShow: '<button data-fancybox-play class="fancybox-button fancybox-button--play" title="{{PLAY_START}}"></button>',
            fullScreen: '<button data-fancybox-fullscreen class="fancybox-button fancybox-button--fullscreen" title="{{FULL_SCREEN}}"></button>',
            thumbs: '<button data-fancybox-thumbs class="fancybox-button fancybox-button--thumbs" title="{{THUMBS}}"></button>',
            close: '<button data-fancybox-close class="fancybox-button fancybox-button--close" title="{{CLOSE}}"></button>',

            // This small close button will be appended to your html/inline/ajax content by default,
            // if "smallBtn" option is not set to false
            smallBtn: '<button data-fancybox-close class="fancybox-close-small" title="{{CLOSE}}"></button>'
        },

        // Container is injected into this element
        parentEl: 'body',


        // Focus handling
        // ==============

        // Try to focus on the first focusable element after opening
        autoFocus: true,

        // Put focus back to active element after closing
        backFocus: true,

        // Do not let user to focus on element outside modal content
        trapFocus: true,


        // Module specific options
        // =======================

        fullScreen: {
            autoStart: false,
        },

        // Set `touch: false` to disable dragging/swiping
        touch: {
            vertical: true, // Allow to drag content vertically
            momentum: true // Continue movement after releasing mouse/touch when panning
        },

        // Hash value when initializing manually,
        // set `false` to disable hash change
        hash: null,

        // Customize or add new media types
        // Example:
        /*
        media : {
            youtube : {
                params : {
                    autoplay : 0
                }
            }
        }
        */
        media: {},

        slideShow: {
            autoStart: false,
            speed: 4000
        },

        thumbs: {
            autoStart: false, // Display thumbnails on opening
            hideOnClose: true // Hide thumbnail grid when closing animation starts
        },

        // Callbacks
        //==========

        // See Documentation/API/Events for more information
        // Example:
        /*
            afterShow: function( instance, current ) {
                 console.info( 'Clicked element:' );
                 console.info( current.opts.$orig );
            }
        */

        onInit: $.noop, // When instance has been initialized

        beforeLoad: $.noop, // Before the content of a slide is being loaded
        afterLoad: $.noop, // When the content of a slide is done loading

        beforeShow: $.noop, // Before open animation starts
        afterShow: $.noop, // When content is done loading and animating

        beforeClose: $.noop, // Before the instance attempts to close. Return false to cancel the close.
        afterClose: $(function(){
            $('form').trigger('reset');
        }), // After instance has been closed

        onActivate: $.noop, // When instance is brought to front
        onDeactivate: $.noop, // When other instance has been activated


        // Interaction
        // ===========

        // Use options below to customize taken action when user clicks or double clicks on the fancyBox area,
        // each option can be string or method that returns value.
        //
        // Possible values:
        //   "close"           - close instance
        //   "next"            - move to next gallery item
        //   "nextOrClose"     - move to next gallery item or close if gallery has only one item
        //   "toggleControls"  - show/hide controls
        //   "zoom"            - zoom image (if loaded)
        //   false             - do nothing

        // Clicked on the content
        clickContent: function(current, event) {
            return current.type === 'image' ? 'zoom' : false;
        },

        // Clicked on the slide
        clickSlide: 'close',

        // Clicked on the background (backdrop) element
        clickOutside: 'close',

        // Same as previous two, but for double click
        dblclickContent: false,
        dblclickSlide: false,
        dblclickOutside: false,


        // Custom options when mobile device is detected
        // =============================================

        mobile: {
            clickContent: function(current, event) {
                return current.type === 'image' ? 'toggleControls' : false;
            },
            clickSlide: function(current, event) {
                return current.type === 'image' ? 'toggleControls' : 'close';
            },
            dblclickContent: function(current, event) {
                return current.type === 'image' ? 'zoom' : false;
            },
            dblclickSlide: function(current, event) {
                return current.type === 'image' ? 'zoom' : false;
            }
        },


        // Internationalization
        // ============

        lang: 'en',
        i18n: {
            'en': {
                CLOSE: 'Close',
                NEXT: 'Next',
                PREV: 'Previous',
                ERROR: 'The requested content cannot be loaded. <br/> Please try again later.',
                PLAY_START: 'Start slideshow',
                PLAY_STOP: 'Pause slideshow',
                FULL_SCREEN: 'Full screen',
                THUMBS: 'Thumbnails'
            },
            'de': {
                CLOSE: 'Schliessen',
                NEXT: 'Weiter',
                PREV: 'Zurück',
                ERROR: 'Die angeforderten Daten konnten nicht geladen werden. <br/> Bitte versuchen Sie es später nochmal.',
                PLAY_START: 'Diaschau starten',
                PLAY_STOP: 'Diaschau beenden',
                FULL_SCREEN: 'Vollbild',
                THUMBS: 'Vorschaubilder'
            }
        }

    };

    // Few useful variables and methods
    // ================================

    var $W = $(window);
    var $D = $(document);

    var called = 0;


    // Check if an object is a jQuery object and not a native JavaScript object
    // ========================================================================

    var isQuery = function(obj) {
        return obj && obj.hasOwnProperty && obj instanceof $;
    };


    // Handle multiple browsers for "requestAnimationFrame" and "cancelAnimationFrame"
    // ===============================================================================

    var requestAFrame = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            // if all else fails, use setTimeout
            function(callback) {
                return window.setTimeout(callback, 1000 / 60);
            };
    })();


    // Detect the supported transition-end event property name
    // =======================================================

    var transitionEnd = (function() {
        var t, el = document.createElement("fakeelement");

        var transitions = {
            "transition": "transitionend",
            "OTransition": "oTransitionEnd",
            "MozTransition": "transitionend",
            "WebkitTransition": "webkitTransitionEnd"
        };

        for (t in transitions) {
            if (el.style[t] !== undefined) {
                return transitions[t];
            }
        }
    })();


    // Force redraw on an element.
    // This helps in cases where the browser doesn't redraw an updated element properly.
    // =================================================================================

    var forceRedraw = function($el) {
        return ($el && $el.length && $el[0].offsetHeight);
    };


    // Class definition
    // ================

    var FancyBox = function(content, opts, index) {
        var self = this;

        self.opts = $.extend(true, { index: index }, defaults, opts || {});

        // Exclude buttons option from deep merging
        if (opts && $.isArray(opts.buttons)) {
            self.opts.buttons = opts.buttons;
        }

        self.id = self.opts.id || ++called;
        self.group = [];

        self.currIndex = parseInt(self.opts.index, 10) || 0;
        self.prevIndex = null;

        self.prevPos = null;
        self.currPos = 0;

        self.firstRun = null;

        // Create group elements from original item collection
        self.createGroup(content);

        if (!self.group.length) {
            return;
        }

        // Save last active element and current scroll position
        self.$lastFocus = $(document.activeElement).blur();

        // Collection of gallery objects
        self.slides = {};

        self.init(content);

    };

    $.extend(FancyBox.prototype, {

        // Create DOM structure
        // ====================

        init: function() {
            var self = this;

            var testWidth, $container, buttonStr;

            var firstItemOpts = self.group[self.currIndex].opts;

            self.scrollTop = $D.scrollTop();
            self.scrollLeft = $D.scrollLeft();


            // Hide scrollbars
            // ===============

            if (!$.fancybox.getInstance() && !$.fancybox.isMobile && $('body').css('overflow') !== 'hidden') {
                testWidth = $('body').width();

                $('html').addClass('fancybox-enabled');

                // Compare body width after applying "overflow: hidden"
                testWidth = $('body').width() - testWidth;

                // If width has changed - compensate missing scrollbars by adding right margin
                if (testWidth > 1) {
                    $('head').append('<style id="fancybox-style-noscroll" type="text/css">.compensate-for-scrollbar, .fancybox-enabled body { margin-right: ' + testWidth + 'px; }</style>');
                }
            }


            // Build html markup and set references
            // ====================================

            // Build html code for buttons and insert into main template
            buttonStr = '';

            $.each(firstItemOpts.buttons, function(index, value) {
                buttonStr += (firstItemOpts.btnTpl[value] || '');
            });

            // Create markup from base template, it will be initially hidden to
            // avoid unnecessary work like painting while initializing is not complete
            $container = $(self.translate(self, firstItemOpts.baseTpl.replace('\{\{BUTTONS\}\}', buttonStr)))
                .addClass('fancybox-is-hidden')
                .attr('id', 'fancybox-container-' + self.id)
                .addClass(firstItemOpts.baseClass)
                .data('FancyBox', self)
                .prependTo(firstItemOpts.parentEl);

            // Create object holding references to jQuery wrapped nodes
            self.$refs = {
                container: $container
            };

            ['bg', 'inner', 'infobar', 'toolbar', 'stage', 'caption'].forEach(function(item) {
                self.$refs[item] = $container.find('.fancybox-' + item);
            });

            // Check for redundant elements
            if (!firstItemOpts.arrows || self.group.length < 2) {
                $container.find('.fancybox-navigation').remove();
            }

            if (!firstItemOpts.infobar) {
                self.$refs.infobar.remove();
            }

            if (!firstItemOpts.toolbar) {
                self.$refs.toolbar.remove();
            }

            self.trigger('onInit');

            // Bring to front and enable events
            self.activate();

            // Build slides, load and reveal content
            self.jumpTo(self.currIndex);
        },


        // Simple i18n support - replaces object keys found in template
        // with corresponding values
        // ============================================================

        translate: function(obj, str) {
            var arr = obj.opts.i18n[obj.opts.lang];

            return str.replace(/\{\{(\w+)\}\}/g, function(match, n) {
                var value = arr[n];

                if (value === undefined) {
                    return match;
                }

                return value;
            });
        },

        // Create array of gally item objects
        // Check if each object has valid type and content
        // ===============================================

        createGroup: function(content) {
            var self = this;
            var items = $.makeArray(content);

            $.each(items, function(i, item) {
                var obj = {},
                    opts = {},
                    data = [],
                    $item,
                    type,
                    src,
                    srcParts;

                // Step 1 - Make sure we have an object
                // ====================================

                if ($.isPlainObject(item)) {

                    // We probably have manual usage here, something like
                    // $.fancybox.open( [ { src : "image.jpg", type : "image" } ] )

                    obj = item;
                    opts = item.opts || item;

                } else if ($.type(item) === 'object' && $(item).length) {

                    // Here we propbably have jQuery collection returned by some selector

                    $item = $(item);
                    data = $item.data();

                    opts = 'options' in data ? data.options : {};
                    opts = $.type(opts) === 'object' ? opts : {};

                    obj.src = 'src' in data ? data.src : (opts.src || $item.attr('href'));

                    ['width', 'height', 'thumb', 'type', 'filter'].forEach(function(item) {
                        if (item in data) {
                            opts[item] = data[item];
                        }
                    });

                    if ('srcset' in data) {
                        opts.image = { srcset: data.srcset };
                    }

                    opts.$orig = $item;

                    if (!obj.type && !obj.src) {
                        obj.type = 'inline';
                        obj.src = item;
                    }

                } else {

                    // Assume we have a simple html code, for example:
                    // $.fancybox.open( '<div><h1>Hi!</h1></div>' );

                    obj = {
                        type: 'html',
                        src: item + ''
                    };

                }

                // Each gallery object has full collection of options
                obj.opts = $.extend(true, {}, self.opts, opts);

                if ($.fancybox.isMobile) {
                    obj.opts = $.extend(true, {}, obj.opts, obj.opts.mobile);
                }


                // Step 2 - Make sure we have content type, if not - try to guess
                // ==============================================================

                type = obj.type || obj.opts.type;
                src = obj.src || '';

                if (!type && src) {
                    if (src.match(/(^data:image\/[a-z0-9+\/=]*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg|ico)((\?|#).*)?$)/i)) {
                        type = 'image';

                    } else if (src.match(/\.(pdf)((\?|#).*)?$/i)) {
                        type = 'pdf';

                    } else if (src.charAt(0) === '#') {
                        type = 'inline';
                    }
                }

                obj.type = type;


                // Step 3 - Some adjustments
                // =========================

                obj.index = self.group.length;

                // Check if $orig and $thumb objects exist
                if (obj.opts.$orig && !obj.opts.$orig.length) {
                    delete obj.opts.$orig;
                }

                if (!obj.opts.$thumb && obj.opts.$orig) {
                    obj.opts.$thumb = obj.opts.$orig.find('img:first');
                }

                if (obj.opts.$thumb && !obj.opts.$thumb.length) {
                    delete obj.opts.$thumb;
                }

                // Caption is a "special" option, it can be passed as a method
                if ($.type(obj.opts.caption) === 'function') {
                    obj.opts.caption = obj.opts.caption.apply(item, [self, obj]);

                } else if ('caption' in data) {
                    obj.opts.caption = data.caption;
                }

                // Make sure we have caption as a string
                obj.opts.caption = obj.opts.caption === undefined ? '' : obj.opts.caption + '';

                // Check if url contains "filter" used to filter the content
                // Example: "ajax.html #something"
                if (type === 'ajax') {
                    srcParts = src.split(/\s+/, 2);

                    if (srcParts.length > 1) {
                        obj.src = srcParts.shift();

                        obj.opts.filter = srcParts.shift();
                    }
                }

                if (obj.opts.smallBtn == 'auto') {

                    if ($.inArray(type, ['html', 'inline', 'ajax']) > -1) {
                        obj.opts.toolbar = false;
                        obj.opts.smallBtn = true;

                    } else {
                        obj.opts.smallBtn = false;
                    }

                }

                // If the type is "pdf", then simply load file into iframe
                if (type === 'pdf') {
                    obj.type = 'iframe';

                    obj.opts.iframe.preload = false;
                }

                // Hide all buttons and disable interactivity for modal items
                if (obj.opts.modal) {

                    obj.opts = $.extend(true, obj.opts, {
                        // Remove buttons
                        infobar: 0,
                        toolbar: 0,

                        smallBtn: 0,

                        // Disable keyboard navigation
                        keyboard: 0,

                        // Disable some modules
                        slideShow: 0,
                        fullScreen: 0,
                        thumbs: 0,
                        touch: 0,

                        // Disable click event handlers
                        clickContent: false,
                        clickSlide: false,
                        clickOutside: false,
                        dblclickContent: false,
                        dblclickSlide: false,
                        dblclickOutside: false
                    });

                }

                // Step 4 - Add processed object to group
                // ======================================

                self.group.push(obj);

            });

        },


        // Attach an event handler functions for:
        //   - navigation buttons
        //   - browser scrolling, resizing;
        //   - focusing
        //   - keyboard
        //   - detect idle
        // ======================================

        addEvents: function() {
            var self = this;

            self.removeEvents();

            // Make navigation elements clickable
            self.$refs.container.on('click.fb-close', '[data-fancybox-close]', function(e) {
                e.stopPropagation();
                e.preventDefault();

                self.close(e);

            }).on('click.fb-prev touchend.fb-prev', '[data-fancybox-prev]', function(e) {
                e.stopPropagation();
                e.preventDefault();

                self.previous();

            }).on('click.fb-next touchend.fb-next', '[data-fancybox-next]', function(e) {
                e.stopPropagation();
                e.preventDefault();

                self.next();

            });


            // Handle page scrolling and browser resizing
            $W.on('orientationchange.fb resize.fb', function(e) {

                if (e && e.originalEvent && e.originalEvent.type === "resize") {

                    requestAFrame(function() {
                        self.update();
                    });

                } else {

                    self.$refs.stage.hide();

                    setTimeout(function() {
                        self.$refs.stage.show();

                        self.update();
                    }, 500);

                }

            });

            // Trap keyboard focus inside of the modal, so the user does not accidentally tab outside of the modal
            // (a.k.a. "escaping the modal")
            $D.on('focusin.fb', function(e) {
                var instance = $.fancybox ? $.fancybox.getInstance() : null;

                if (instance.isClosing || !instance.current || !instance.current.opts.trapFocus || $(e.target).hasClass('fancybox-container') || $(e.target).is(document)) {
                    return;
                }

                if (instance && $(e.target).css('position') !== 'fixed' && !instance.$refs.container.has(e.target).length) {
                    e.stopPropagation();

                    instance.focus();

                    // Sometimes page gets scrolled, set it back
                    $W.scrollTop(self.scrollTop).scrollLeft(self.scrollLeft);
                }
            });


            // Enable keyboard navigation
            $D.on('keydown.fb', function(e) {
                var current = self.current,
                    keycode = e.keyCode || e.which;

                if (!current || !current.opts.keyboard) {
                    return;
                }

                if ($(e.target).is('input') || $(e.target).is('textarea')) {
                    return;
                }

                // Backspace and Esc keys
                if (keycode === 8 || keycode === 27) {
                    e.preventDefault();

                    self.close(e);

                    return;
                }

                // Left arrow and Up arrow
                if (keycode === 37 || keycode === 38) {
                    e.preventDefault();

                    self.previous();

                    return;
                }

                // Righ arrow and Down arrow
                if (keycode === 39 || keycode === 40) {
                    e.preventDefault();

                    self.next();

                    return;
                }

                self.trigger('afterKeydown', e, keycode);
            });


            // Hide controls after some inactivity period
            if (self.group[self.currIndex].opts.idleTime) {
                self.idleSecondsCounter = 0;

                $D.on('mousemove.fb-idle mouseenter.fb-idle mouseleave.fb-idle mousedown.fb-idle touchstart.fb-idle touchmove.fb-idle scroll.fb-idle keydown.fb-idle', function() {
                    self.idleSecondsCounter = 0;

                    if (self.isIdle) {
                        self.showControls();
                    }

                    self.isIdle = false;
                });

                self.idleInterval = window.setInterval(function() {

                    self.idleSecondsCounter++;

                    if (self.idleSecondsCounter >= self.group[self.currIndex].opts.idleTime) {
                        self.isIdle = true;
                        self.idleSecondsCounter = 0;

                        self.hideControls();
                    }

                }, 1000);
            }

        },


        // Remove events added by the core
        // ===============================

        removeEvents: function() {
            var self = this;

            $W.off('orientationchange.fb resize.fb');
            $D.off('focusin.fb keydown.fb .fb-idle');

            this.$refs.container.off('.fb-close .fb-prev .fb-next');

            if (self.idleInterval) {
                window.clearInterval(self.idleInterval);

                self.idleInterval = null;
            }
        },


        // Change to previous gallery item
        // ===============================

        previous: function(duration) {
            return this.jumpTo(this.currPos - 1, duration);
        },


        // Change to next gallery item
        // ===========================

        next: function(duration) {
            return this.jumpTo(this.currPos + 1, duration);
        },


        // Switch to selected gallery item
        // ===============================

        jumpTo: function(pos, duration, slide) {
            var self = this,
                firstRun,
                loop,
                current,
                previous,
                canvasWidth,
                currentPos,
                transitionProps;

            var groupLen = self.group.length;

            if (self.isSliding || self.isClosing || (self.isAnimating && self.firstRun)) {
                return;
            }

            pos = parseInt(pos, 10);
            loop = self.current ? self.current.opts.loop : self.opts.loop;

            if (!loop && (pos < 0 || pos >= groupLen)) {
                return false;
            }

            firstRun = self.firstRun = (self.firstRun === null);

            if (groupLen < 2 && !firstRun && !!self.isSliding) {
                return;
            }

            previous = self.current;

            self.prevIndex = self.currIndex;
            self.prevPos = self.currPos;

            // Create slides
            current = self.createSlide(pos);

            if (groupLen > 1) {
                if (loop || current.index > 0) {
                    self.createSlide(pos - 1);
                }

                if (loop || current.index < groupLen - 1) {
                    self.createSlide(pos + 1);
                }
            }

            self.current = current;
            self.currIndex = current.index;
            self.currPos = current.pos;

            self.trigger('beforeShow', firstRun);

            self.updateControls();

            currentPos = $.fancybox.getTranslate(current.$slide);

            current.isMoved = (currentPos.left !== 0 || currentPos.top !== 0) && !current.$slide.hasClass('fancybox-animated');
            current.forcedDuration = undefined;

            if ($.isNumeric(duration)) {
                current.forcedDuration = duration;
            } else {
                duration = current.opts[firstRun ? 'animationDuration' : 'transitionDuration'];
            }

            duration = parseInt(duration, 10);

            // Fresh start - reveal container, current slide and start loading content
            if (firstRun) {

                if (current.opts.animationEffect && duration) {
                    self.$refs.container.css('transition-duration', duration + 'ms');
                }

                self.$refs.container.removeClass('fancybox-is-hidden');

                forceRedraw(self.$refs.container);

                self.$refs.container.addClass('fancybox-is-open');

                // Make first slide visible (to display loading icon, if needed)
                current.$slide.addClass('fancybox-slide--current');

                self.loadSlide(current);

                self.preload();

                return;
            }

            // Clean up
            $.each(self.slides, function(index, slide) {
                $.fancybox.stop(slide.$slide);
            });

            // Make current that slide is visible even if content is still loading
            current.$slide.removeClass('fancybox-slide--next fancybox-slide--previous').addClass('fancybox-slide--current');

            // If slides have been dragged, animate them to correct position
            if (current.isMoved) {
                canvasWidth = Math.round(current.$slide.width());

                $.each(self.slides, function(index, slide) {
                    var pos = slide.pos - current.pos;

                    $.fancybox.animate(slide.$slide, {
                        top: 0,
                        left: (pos * canvasWidth) + (pos * slide.opts.gutter)
                    }, duration, function() {

                        slide.$slide.removeAttr('style').removeClass('fancybox-slide--next fancybox-slide--previous');

                        if (slide.pos === self.currPos) {
                            current.isMoved = false;

                            self.complete();
                        }
                    });
                });

            } else {
                self.$refs.stage.children().removeAttr('style');
            }

            // Start transition that reveals current content
            // or wait when it will be loaded

            if (current.isLoaded) {
                self.revealContent(current);

            } else {
                self.loadSlide(current);
            }

            self.preload();

            if (previous.pos === current.pos) {
                return;
            }

            // Handle previous slide
            // =====================

            transitionProps = 'fancybox-slide--' + (previous.pos > current.pos ? 'next' : 'previous');

            previous.$slide.removeClass('fancybox-slide--complete fancybox-slide--current fancybox-slide--next fancybox-slide--previous');

            previous.isComplete = false;

            if (!duration || (!current.isMoved && !current.opts.transitionEffect)) {
                return;
            }

            if (current.isMoved) {
                previous.$slide.addClass(transitionProps);

            } else {

                transitionProps = 'fancybox-animated ' + transitionProps + ' fancybox-fx-' + current.opts.transitionEffect;

                $.fancybox.animate(previous.$slide, transitionProps, duration, function() {
                    previous.$slide.removeClass(transitionProps).removeAttr('style');
                });

            }

        },


        // Create new "slide" element
        // These are gallery items  that are actually added to DOM
        // =======================================================

        createSlide: function(pos) {

            var self = this;
            var $slide;
            var index;

            index = pos % self.group.length;
            index = index < 0 ? self.group.length + index : index;

            if (!self.slides[pos] && self.group[index]) {
                $slide = $('<div class="fancybox-slide"></div>').appendTo(self.$refs.stage);

                self.slides[pos] = $.extend(true, {}, self.group[index], {
                    pos: pos,
                    $slide: $slide,
                    isLoaded: false,
                });

                self.updateSlide(self.slides[pos]);
            }

            return self.slides[pos];
        },


        // Scale image to the actual size of the image
        // ===========================================

        scaleToActual: function(x, y, duration) {

            var self = this;

            var current = self.current;
            var $what = current.$content;

            var imgPos, posX, posY, scaleX, scaleY;

            var canvasWidth = parseInt(current.$slide.width(), 10);
            var canvasHeight = parseInt(current.$slide.height(), 10);

            var newImgWidth = current.width;
            var newImgHeight = current.height;

            if (!(current.type == 'image' && !current.hasError) || !$what || self.isAnimating) {
                return;
            }

            $.fancybox.stop($what);

            self.isAnimating = true;

            x = x === undefined ? canvasWidth * 0.5 : x;
            y = y === undefined ? canvasHeight * 0.5 : y;

            imgPos = $.fancybox.getTranslate($what);

            scaleX = newImgWidth / imgPos.width;
            scaleY = newImgHeight / imgPos.height;

            // Get center position for original image
            posX = (canvasWidth * 0.5 - newImgWidth * 0.5);
            posY = (canvasHeight * 0.5 - newImgHeight * 0.5);

            // Make sure image does not move away from edges
            if (newImgWidth > canvasWidth) {
                posX = imgPos.left * scaleX - ((x * scaleX) - x);

                if (posX > 0) {
                    posX = 0;
                }

                if (posX < canvasWidth - newImgWidth) {
                    posX = canvasWidth - newImgWidth;
                }
            }

            if (newImgHeight > canvasHeight) {
                posY = imgPos.top * scaleY - ((y * scaleY) - y);

                if (posY > 0) {
                    posY = 0;
                }

                if (posY < canvasHeight - newImgHeight) {
                    posY = canvasHeight - newImgHeight;
                }
            }

            self.updateCursor(newImgWidth, newImgHeight);

            $.fancybox.animate($what, {
                top: posY,
                left: posX,
                scaleX: scaleX,
                scaleY: scaleY
            }, duration || 330, function() {
                self.isAnimating = false;
            });

            // Stop slideshow
            if (self.SlideShow && self.SlideShow.isActive) {
                self.SlideShow.stop();
            }
        },


        // Scale image to fit inside parent element
        // ========================================

        scaleToFit: function(duration) {

            var self = this;

            var current = self.current;
            var $what = current.$content;
            var end;

            if (!(current.type == 'image' && !current.hasError) || !$what || self.isAnimating) {
                return;
            }

            $.fancybox.stop($what);

            self.isAnimating = true;

            end = self.getFitPos(current);

            self.updateCursor(end.width, end.height);

            $.fancybox.animate($what, {
                top: end.top,
                left: end.left,
                scaleX: end.width / $what.width(),
                scaleY: end.height / $what.height()
            }, duration || 330, function() {
                self.isAnimating = false;
            });

        },

        // Calculate image size to fit inside viewport
        // ===========================================

        getFitPos: function(slide) {
            var self = this;
            var $what = slide.$content;

            var imgWidth = slide.width;
            var imgHeight = slide.height;

            var margin = slide.opts.margin;

            var canvasWidth, canvasHeight, minRatio, width, height;

            if (!$what || !$what.length || (!imgWidth && !imgHeight)) {
                return false;
            }

            // Convert "margin to CSS style: [ top, right, bottom, left ]
            if ($.type(margin) === "number") {
                margin = [margin, margin];
            }

            if (margin.length == 2) {
                margin = [margin[0], margin[1], margin[0], margin[1]];
            }

            if ($W.width() < 800) {
                margin = [0, 0, 0, 0];
            }

            // We can not use $slide width here, because it can have different diemensions while in transiton
            canvasWidth = parseInt(self.$refs.stage.width(), 10) - (margin[1] + margin[3]);
            canvasHeight = parseInt(self.$refs.stage.height(), 10) - (margin[0] + margin[2]);

            minRatio = Math.min(1, canvasWidth / imgWidth, canvasHeight / imgHeight);

            width = Math.floor(minRatio * imgWidth);
            height = Math.floor(minRatio * imgHeight);

            // Use floor rounding to make sure it really fits
            return {
                top: Math.floor((canvasHeight - height) * 0.5) + margin[0],
                left: Math.floor((canvasWidth - width) * 0.5) + margin[3],
                width: width,
                height: height
            };

        },


        // Update position and content of all slides
        // =========================================

        update: function() {

            var self = this;

            $.each(self.slides, function(key, slide) {
                self.updateSlide(slide);
            });

        },


        // Update slide position and scale content to fit
        // ==============================================

        updateSlide: function(slide) {

            var self = this;
            var $what = slide.$content;

            if ($what && (slide.width || slide.height)) {
                $.fancybox.stop($what);

                $.fancybox.setTranslate($what, self.getFitPos(slide));

                if (slide.pos === self.currPos) {
                    self.updateCursor();
                }
            }

            slide.$slide.trigger('refresh');

            self.trigger('onUpdate', slide);

        },

        // Update cursor style depending if content can be zoomed
        // ======================================================

        updateCursor: function(nextWidth, nextHeight) {

            var self = this;
            var isScaledDown;

            var $container = self.$refs.container.removeClass('fancybox-is-zoomable fancybox-can-zoomIn fancybox-can-drag fancybox-can-zoomOut');

            if (!self.current || self.isClosing) {
                return;
            }

            if (self.isZoomable()) {

                $container.addClass('fancybox-is-zoomable');

                if (nextWidth !== undefined && nextHeight !== undefined) {
                    isScaledDown = nextWidth < self.current.width && nextHeight < self.current.height;

                } else {
                    isScaledDown = self.isScaledDown();
                }

                if (isScaledDown) {

                    // If image is scaled down, then, obviously, it can be zoomed to full size
                    $container.addClass('fancybox-can-zoomIn');

                } else {

                    if (self.current.opts.touch) {

                        // If image size ir largen than available available and touch module is not disable,
                        // then user can do panning
                        $container.addClass('fancybox-can-drag');

                    } else {
                        $container.addClass('fancybox-can-zoomOut');
                    }

                }

            } else if (self.current.opts.touch) {
                $container.addClass('fancybox-can-drag');
            }

        },


        // Check if current slide is zoomable
        // ==================================

        isZoomable: function() {

            var self = this;

            var current = self.current;
            var fitPos;

            if (!current || self.isClosing) {
                return;
            }

            // Assume that slide is zoomable if
            //   - image is loaded successfuly
            //   - click action is "zoom"
            //   - actual size of the image is smaller than available area
            if (current.type === 'image' && current.isLoaded && !current.hasError &&
                (current.opts.clickContent === 'zoom' || ($.isFunction(current.opts.clickContent) && current.opts.clickContent(current) === "zoom"))
            ) {

                fitPos = self.getFitPos(current);

                if (current.width > fitPos.width || current.height > fitPos.height) {
                    return true;
                }

            }

            return false;

        },


        // Check if current image dimensions are smaller than actual
        // =========================================================

        isScaledDown: function() {

            var self = this;

            var current = self.current;
            var $what = current.$content;

            var rez = false;

            if ($what) {
                rez = $.fancybox.getTranslate($what);
                rez = rez.width < current.width || rez.height < current.height;
            }

            return rez;

        },


        // Check if image dimensions exceed parent element
        // ===============================================

        canPan: function() {

            var self = this;

            var current = self.current;
            var $what = current.$content;

            var rez = false;

            if ($what) {
                rez = self.getFitPos(current);
                rez = Math.abs($what.width() - rez.width) > 1 || Math.abs($what.height() - rez.height) > 1;

            }

            return rez;

        },


        // Load content into the slide
        // ===========================

        loadSlide: function(slide) {

            var self = this,
                type, $slide;
            var ajaxLoad;

            if (slide.isLoading) {
                return;
            }

            if (slide.isLoaded) {
                return;
            }

            slide.isLoading = true;

            self.trigger('beforeLoad', slide);

            type = slide.type;
            $slide = slide.$slide;

            $slide
                .off('refresh')
                .trigger('onReset')
                .addClass('fancybox-slide--' + (type || 'unknown'))
                .addClass(slide.opts.slideClass);

            // Create content depending on the type

            switch (type) {

                case 'image':

                    self.setImage(slide);

                    break;

                case 'iframe':

                    self.setIframe(slide);

                    break;

                case 'html':

                    self.setContent(slide, slide.src || slide.content);

                    break;

                case 'inline':

                    if ($(slide.src).length) {
                        self.setContent(slide, $(slide.src));

                    } else {
                        self.setError(slide);
                    }

                    break;

                case 'ajax':

                    self.showLoading(slide);

                    ajaxLoad = $.ajax($.extend({}, slide.opts.ajax.settings, {
                        url: slide.src,
                        success: function(data, textStatus) {

                            if (textStatus === 'success') {
                                self.setContent(slide, data);
                            }

                        },
                        error: function(jqXHR, textStatus) {

                            if (jqXHR && textStatus !== 'abort') {
                                self.setError(slide);
                            }

                        }
                    }));

                    $slide.one('onReset', function() {
                        ajaxLoad.abort();
                    });

                    break;

                default:

                    self.setError(slide);

                    break;

            }

            return true;

        },


        // Use thumbnail image, if possible
        // ================================

        setImage: function(slide) {

            var self = this;
            var srcset = slide.opts.image.srcset;

            var found, temp, pxRatio, windowWidth;

            // If we have "srcset", then we need to find matching "src" value.
            // This is necessary, because when you set an src attribute, the browser will preload the image
            // before any javascript or even CSS is applied.
            if (srcset) {
                pxRatio = window.devicePixelRatio || 1;
                windowWidth = window.innerWidth * pxRatio;

                temp = srcset.split(',').map(function(el) {
                    var ret = {};

                    el.trim().split(/\s+/).forEach(function(el, i) {
                        var value = parseInt(el.substring(0, el.length - 1), 10);

                        if (i === 0) {
                            return (ret.url = el);
                        }

                        if (value) {
                            ret.value = value;
                            ret.postfix = el[el.length - 1];
                        }

                    });

                    return ret;
                });

                // Sort by value
                temp.sort(function(a, b) {
                    return a.value - b.value;
                });

                // Ok, now we have an array of all srcset values
                for (var j = 0; j < temp.length; j++) {
                    var el = temp[j];

                    if ((el.postfix === 'w' && el.value >= windowWidth) || (el.postfix === 'x' && el.value >= pxRatio)) {
                        found = el;
                        break;
                    }
                }

                // If not found, take the last one
                if (!found && temp.length) {
                    found = temp[temp.length - 1];
                }

                if (found) {
                    slide.src = found.url;

                    // If we have default width/height values, we can calculate height for matching source
                    if (slide.width && slide.height && found.postfix == 'w') {
                        slide.height = (slide.width / slide.height) * found.value;
                        slide.width = found.value;
                    }
                }
            }

            // This will be wrapper containing both ghost and actual image
            slide.$content = $('<div class="fancybox-image-wrap"></div>')
                .addClass('fancybox-is-hidden')
                .appendTo(slide.$slide);


            // If we have a thumbnail, we can display it while actual image is loading
            // Users will not stare at black screen and actual image will appear gradually
            if (slide.opts.preload !== false && slide.opts.width && slide.opts.height && (slide.opts.thumb || slide.opts.$thumb)) {

                slide.width = slide.opts.width;
                slide.height = slide.opts.height;

                slide.$ghost = $('<img />')
                    .one('error', function() {

                        $(this).remove();

                        slide.$ghost = null;

                        self.setBigImage(slide);

                    })
                    .one('load', function() {

                        self.afterLoad(slide);

                        self.setBigImage(slide);

                    })
                    .addClass('fancybox-image')
                    .appendTo(slide.$content)
                    .attr('src', slide.opts.thumb || slide.opts.$thumb.attr('src'));

            } else {

                self.setBigImage(slide);

            }

        },


        // Create full-size image
        // ======================

        setBigImage: function(slide) {
            var self = this;
            var $img = $('<img />');

            slide.$image = $img
                .one('error', function() {

                    self.setError(slide);

                })
                .one('load', function() {

                    // Clear timeout that checks if loading icon needs to be displayed
                    clearTimeout(slide.timouts);

                    slide.timouts = null;

                    if (self.isClosing) {
                        return;
                    }

                    slide.width = this.naturalWidth;
                    slide.height = this.naturalHeight;

                    if (slide.opts.image.srcset) {
                        $img.attr('sizes', '100vw').attr('srcset', slide.opts.image.srcset);
                    }

                    self.hideLoading(slide);

                    if (slide.$ghost) {

                        slide.timouts = setTimeout(function() {
                            slide.timouts = null;

                            slide.$ghost.hide();

                        }, Math.min(300, Math.max(1000, slide.height / 1600)));

                    } else {
                        self.afterLoad(slide);
                    }

                })
                .addClass('fancybox-image')
                .attr('src', slide.src)
                .appendTo(slide.$content);

            if (($img[0].complete || $img[0].readyState == "complete") && $img[0].naturalWidth && $img[0].naturalHeight) {
                $img.trigger('load');

            } else if ($img[0].error) {
                $img.trigger('error');

            } else {

                slide.timouts = setTimeout(function() {
                    if (!$img[0].complete && !slide.hasError) {
                        self.showLoading(slide);
                    }

                }, 100);

            }

        },


        // Create iframe wrapper, iframe and bindings
        // ==========================================

        setIframe: function(slide) {
            var self = this,
                opts = slide.opts.iframe,
                $slide = slide.$slide,
                $iframe;

            slide.$content = $('<div class="fancybox-content' + (opts.preload ? ' fancybox-is-hidden' : '') + '"></div>')
                .css(opts.css)
                .appendTo($slide);

            $iframe = $(opts.tpl.replace(/\{rnd\}/g, new Date().getTime()))
                .attr(opts.attr)
                .appendTo(slide.$content);

            if (opts.preload) {

                self.showLoading(slide);

                // Unfortunately, it is not always possible to determine if iframe is successfully loaded
                // (due to browser security policy)

                $iframe.on('load.fb error.fb', function(e) {
                    this.isReady = 1;

                    slide.$slide.trigger('refresh');

                    self.afterLoad(slide);
                });

                // Recalculate iframe content size
                // ===============================

                $slide.on('refresh.fb', function() {
                    var $wrap = slide.$content,
                        frameWidth = opts.css.width,
                        frameHeight = opts.css.height,
                        scrollWidth,
                        $contents,
                        $body;

                    if ($iframe[0].isReady !== 1) {
                        return;
                    }

                    // Check if content is accessible,
                    // it will fail if frame is not with the same origin

                    try {
                        $contents = $iframe.contents();
                        $body = $contents.find('body');

                    } catch (ignore) {}

                    // Calculate dimensions for the wrapper
                    if ($body && $body.length) {

                        if (frameWidth === undefined) {
                            scrollWidth = $iframe[0].contentWindow.document.documentElement.scrollWidth;

                            frameWidth = Math.ceil($body.outerWidth(true) + ($wrap.width() - scrollWidth));
                            frameWidth += $wrap.outerWidth() - $wrap.innerWidth();
                        }

                        if (frameHeight === undefined) {
                            frameHeight = Math.ceil($body.outerHeight(true));
                            frameHeight += $wrap.outerHeight() - $wrap.innerHeight();
                        }

                        // Resize wrapper to fit iframe content
                        if (frameWidth) {
                            $wrap.width(frameWidth);
                        }

                        if (frameHeight) {
                            $wrap.height(frameHeight);
                        }
                    }

                    $wrap.removeClass('fancybox-is-hidden');

                });

            } else {

                this.afterLoad(slide);

            }

            $iframe.attr('src', slide.src);

            if (slide.opts.smallBtn === true) {
                slide.$content.prepend(self.translate(slide, slide.opts.btnTpl.smallBtn));
            }

            // Remove iframe if closing or changing gallery item
            $slide.one('onReset', function() {

                // This helps IE not to throw errors when closing
                try {

                    $(this).find('iframe').hide().attr('src', '//about:blank');

                } catch (ignore) {}

                $(this).empty();

                slide.isLoaded = false;

            });

        },


        // Wrap and append content to the slide
        // ======================================

        setContent: function(slide, content) {

            var self = this;

            if (self.isClosing) {
                return;
            }

            self.hideLoading(slide);

            slide.$slide.empty();

            if (isQuery(content) && content.parent().length) {

                // If content is a jQuery object, then it will be moved to the slide.
                // The placeholder is created so we will know where to put it back.
                // If user is navigating gallery fast, then the content might be already inside fancyBox
                // =====================================================================================

                // Make sure content is not already moved to fancyBox
                content.parent('.fancybox-slide--inline').trigger('onReset');

                // Create temporary element marking original place of the content
                slide.$placeholder = $('<div></div>').hide().insertAfter(content);

                // Make sure content is visible
                content.css('display', 'inline-block');

            } else if (!slide.hasError) {

                // If content is just a plain text, try to convert it to html
                if ($.type(content) === 'string') {
                    content = $('<div>').append($.trim(content)).contents();

                    // If we have text node, then add wrapping element to make vertical alignment work
                    if (content[0].nodeType === 3) {
                        content = $('<div>').html(content);
                    }
                }

                // If "filter" option is provided, then filter content
                if (slide.opts.filter) {
                    content = $('<div>').html(content).find(slide.opts.filter);
                }

            }

            slide.$slide.one('onReset', function() {

                // Put content back
                if (slide.$placeholder) {
                    slide.$placeholder.after(content.hide()).remove();

                    slide.$placeholder = null;
                }

                // Remove custom close button
                if (slide.$smallBtn) {
                    slide.$smallBtn.remove();

                    slide.$smallBtn = null;
                }

                // Remove content and mark slide as not loaded
                if (!slide.hasError) {
                    $(this).empty();

                    slide.isLoaded = false;
                }

            });

            slide.$content = $(content).appendTo(slide.$slide);

            if (slide.opts.smallBtn && !slide.$smallBtn) {
                slide.$smallBtn = $(self.translate(slide, slide.opts.btnTpl.smallBtn)).appendTo(slide.$content.filter('div').first());
            }

            this.afterLoad(slide);
        },

        // Display error message
        // =====================

        setError: function(slide) {

            slide.hasError = true;

            slide.$slide.removeClass('fancybox-slide--' + slide.type);

            this.setContent(slide, this.translate(slide, slide.opts.errorTpl));

        },


        // Show loading icon inside the slide
        // ==================================

        showLoading: function(slide) {

            var self = this;

            slide = slide || self.current;

            if (slide && !slide.$spinner) {
                slide.$spinner = $(self.opts.spinnerTpl).appendTo(slide.$slide);
            }

        },

        // Remove loading icon from the slide
        // ==================================

        hideLoading: function(slide) {

            var self = this;

            slide = slide || self.current;

            if (slide && slide.$spinner) {
                slide.$spinner.remove();

                delete slide.$spinner;
            }

        },


        // Adjustments after slide content has been loaded
        // ===============================================

        afterLoad: function(slide) {

            var self = this;

            if (self.isClosing) {
                return;
            }

            slide.isLoading = false;
            slide.isLoaded = true;

            self.trigger('afterLoad', slide);

            self.hideLoading(slide);

            if (slide.opts.protect && slide.$content && !slide.hasError) {

                // Disable right click
                slide.$content.on('contextmenu.fb', function(e) {
                    if (e.button == 2) {
                        e.preventDefault();
                    }

                    return true;
                });

                // Add fake element on top of the image
                // This makes a bit harder for user to select image
                if (slide.type === 'image') {
                    $('<div class="fancybox-spaceball"></div>').appendTo(slide.$content);
                }

            }

            self.revealContent(slide);

        },


        // Make content visible
        // This method is called right after content has been loaded or
        // user navigates gallery and transition should start
        // ============================================================

        revealContent: function(slide) {

            var self = this;
            var $slide = slide.$slide;

            var effect, effectClassName, duration, opacity, end, start = false;

            effect = slide.opts[self.firstRun ? 'animationEffect' : 'transitionEffect'];
            duration = slide.opts[self.firstRun ? 'animationDuration' : 'transitionDuration'];

            duration = parseInt(slide.forcedDuration === undefined ? duration : slide.forcedDuration, 10);

            if (slide.isMoved || slide.pos !== self.currPos || !duration) {
                effect = false;
            }

            // Check if can zoom
            if (effect === 'zoom' && !(slide.pos === self.currPos && duration && slide.type === 'image' && !slide.hasError && (start = self.getThumbPos(slide)))) {
                effect = 'fade';
            }

            // Zoom animation
            // ==============

            if (effect === 'zoom') {
                end = self.getFitPos(slide);

                end.scaleX = end.width / start.width;
                end.scaleY = end.height / start.height;

                delete end.width;
                delete end.height;

                // Check if we need to animate opacity
                opacity = slide.opts.zoomOpacity;

                if (opacity == 'auto') {
                    opacity = Math.abs(slide.width / slide.height - start.width / start.height) > 0.1;
                }

                if (opacity) {
                    start.opacity = 0.1;
                    end.opacity = 1;
                }

                // Draw image at start position
                $.fancybox.setTranslate(slide.$content.removeClass('fancybox-is-hidden'), start);

                forceRedraw(slide.$content);

                // Start animation
                $.fancybox.animate(slide.$content, end, duration, function() {
                    self.complete();
                });

                return;
            }


            self.updateSlide(slide);


            // Simply show content
            // ===================

            if (!effect) {
                forceRedraw($slide);

                slide.$content.removeClass('fancybox-is-hidden');

                if (slide.pos === self.currPos) {
                    self.complete();
                }

                return;
            }

            $.fancybox.stop($slide);

            effectClassName = 'fancybox-animated fancybox-slide--' + (slide.pos > self.prevPos ? 'next' : 'previous') + ' fancybox-fx-' + effect;

            $slide.removeAttr('style').removeClass('fancybox-slide--current fancybox-slide--next fancybox-slide--previous').addClass(effectClassName);

            slide.$content.removeClass('fancybox-is-hidden');

            //Force reflow for CSS3 transitions
            forceRedraw($slide);

            $.fancybox.animate($slide, 'fancybox-slide--current', duration, function(e) {
                $slide.removeClass(effectClassName).removeAttr('style');

                if (slide.pos === self.currPos) {
                    self.complete();
                }

            }, true);

        },


        // Check if we can and have to zoom from thumbnail
        //================================================

        getThumbPos: function(slide) {

            var self = this;
            var rez = false;

            // Check if element is inside the viewport by at least 1 pixel
            var isElementVisible = function($el) {
                var element = $el[0];

                var elementRect = element.getBoundingClientRect();
                var parentRects = [];

                var visibleInAllParents;

                while (element.parentElement !== null) {
                    if ($(element.parentElement).css('overflow') === 'hidden' || $(element.parentElement).css('overflow') === 'auto') {
                        parentRects.push(element.parentElement.getBoundingClientRect());
                    }

                    element = element.parentElement;
                }

                visibleInAllParents = parentRects.every(function(parentRect) {
                    var visiblePixelX = Math.min(elementRect.right, parentRect.right) - Math.max(elementRect.left, parentRect.left);
                    var visiblePixelY = Math.min(elementRect.bottom, parentRect.bottom) - Math.max(elementRect.top, parentRect.top);

                    return visiblePixelX > 0 && visiblePixelY > 0;
                });

                return visibleInAllParents &&
                    elementRect.bottom > 0 && elementRect.right > 0 &&
                    elementRect.left < $(window).width() && elementRect.top < $(window).height();
            };

            var $thumb = slide.opts.$thumb;
            var thumbPos = $thumb ? $thumb.offset() : 0;
            var slidePos;

            if (thumbPos && $thumb[0].ownerDocument === document && isElementVisible($thumb)) {
                slidePos = self.$refs.stage.offset();

                rez = {
                    top: thumbPos.top - slidePos.top + parseFloat($thumb.css("border-top-width") || 0),
                    left: thumbPos.left - slidePos.left + parseFloat($thumb.css("border-left-width") || 0),
                    width: $thumb.width(),
                    height: $thumb.height(),
                    scaleX: 1,
                    scaleY: 1
                };
            }

            return rez;
        },


        // Final adjustments after current gallery item is moved to position
        // and it`s content is loaded
        // ==================================================================

        complete: function() {

            var self = this;

            var current = self.current;
            var slides = {};

            if (current.isMoved || !current.isLoaded || current.isComplete) {
                return;
            }

            current.isComplete = true;

            current.$slide.siblings().trigger('onReset');

            // Trigger any CSS3 transiton inside the slide
            forceRedraw(current.$slide);

            current.$slide.addClass('fancybox-slide--complete');

            // Remove unnecessary slides
            $.each(self.slides, function(key, slide) {
                if (slide.pos >= self.currPos - 1 && slide.pos <= self.currPos + 1) {
                    slides[slide.pos] = slide;

                } else if (slide) {

                    $.fancybox.stop(slide.$slide);

                    slide.$slide.off().remove();
                }
            });

            self.slides = slides;

            self.updateCursor();

            self.trigger('afterShow');

            // Try to focus on the first focusable element
            if ($(document.activeElement).is('[disabled]') || (current.opts.autoFocus && !(current.type == 'image' || current.type === 'iframe'))) {
                self.focus();
            }

        },


        // Preload next and previous slides
        // ================================

        preload: function() {
            var self = this;
            var next, prev;

            if (self.group.length < 2) {
                return;
            }

            next = self.slides[self.currPos + 1];
            prev = self.slides[self.currPos - 1];

            if (next && next.type === 'image') {
                self.loadSlide(next);
            }

            if (prev && prev.type === 'image') {
                self.loadSlide(prev);
            }

        },


        // Try to find and focus on the first focusable element
        // ====================================================

        focus: function() {
            var current = this.current;
            var $el;

            if (this.isClosing) {
                return;
            }

            if (current && current.isComplete) {

                // Look for first input with autofocus attribute
                $el = current.$slide.find('input[autofocus]:enabled:visible:first');

                if (!$el.length) {
                    $el = current.$slide.find('button,:input,[tabindex],a').filter(':enabled:visible:first');
                }
            }

            $el = $el && $el.length ? $el : this.$refs.container;

            $el.focus();
        },


        // Activates current instance - brings container to the front and enables keyboard,
        // notifies other instances about deactivating
        // =================================================================================

        activate: function() {
            var self = this;

            // Deactivate all instances
            $('.fancybox-container').each(function() {
                var instance = $(this).data('FancyBox');

                // Skip self and closing instances
                if (instance && instance.uid !== self.uid && !instance.isClosing) {
                    instance.trigger('onDeactivate');
                }

            });

            if (self.current) {
                if (self.$refs.container.index() > 0) {
                    self.$refs.container.prependTo(document.body);
                }

                self.updateControls();
            }

            self.trigger('onActivate');

            self.addEvents();

        },


        // Start closing procedure
        // This will start "zoom-out" animation if needed and clean everything up afterwards
        // =================================================================================

        close: function(e, d) {

            var self = this;
            var current = self.current;

            var effect, duration;
            var $what, opacity, start, end;

            var done = function() {
                self.cleanUp(e);
            };

            if (self.isClosing) {
                return false;
            }

            self.isClosing = true;

            // If beforeClose callback prevents closing, make sure content is centered
            if (self.trigger('beforeClose', e) === false) {
                self.isClosing = false;

                requestAFrame(function() {
                    self.update();
                });

                return false;
            }

            // Remove all events
            // If there are multiple instances, they will be set again by "activate" method
            self.removeEvents();

            if (current.timouts) {
                clearTimeout(current.timouts);
            }

            $what = current.$content;
            effect = current.opts.animationEffect;
            duration = $.isNumeric(d) ? d : (effect ? current.opts.animationDuration : 0);

            // Remove other slides
            current.$slide.off(transitionEnd).removeClass('fancybox-slide--complete fancybox-slide--next fancybox-slide--previous fancybox-animated');

            current.$slide.siblings().trigger('onReset').remove();

            // Trigger animations
            if (duration) {
                self.$refs.container.removeClass('fancybox-is-open').addClass('fancybox-is-closing');
            }

            // Clean up
            self.hideLoading(current);

            self.hideControls();

            self.updateCursor();

            // Check if possible to zoom-out
            if (effect === 'zoom' && !(e !== true && $what && duration && current.type === 'image' && !current.hasError && (end = self.getThumbPos(current)))) {
                effect = 'fade';
            }

            if (effect === 'zoom') {
                $.fancybox.stop($what);

                start = $.fancybox.getTranslate($what);

                start.width = start.width * start.scaleX;
                start.height = start.height * start.scaleY;

                // Check if we need to animate opacity
                opacity = current.opts.zoomOpacity;

                if (opacity == 'auto') {
                    opacity = Math.abs(current.width / current.height - end.width / end.height) > 0.1;
                }

                if (opacity) {
                    end.opacity = 0;
                }

                start.scaleX = start.width / end.width;
                start.scaleY = start.height / end.height;

                start.width = end.width;
                start.height = end.height;

                $.fancybox.setTranslate(current.$content, start);

                $.fancybox.animate(current.$content, end, duration, done);

                return true;
            }

            if (effect && duration) {

                // If skip animation
                if (e === true) {
                    setTimeout(done, duration);

                } else {
                    $.fancybox.animate(current.$slide.removeClass('fancybox-slide--current'), 'fancybox-animated fancybox-slide--previous fancybox-fx-' + effect, duration, done);
                }

            } else {
                done();
            }

            return true;
        },


        // Final adjustments after removing the instance
        // =============================================

        cleanUp: function(e) {
            var self = this,
                instance;

            self.current.$slide.trigger('onReset');

            self.$refs.container.empty().remove();

            self.trigger('afterClose', e);

            // Place back focus
            if (self.$lastFocus && !!self.current.opts.backFocus) {
                self.$lastFocus.focus();
            }

            self.current = null;

            // Check if there are other instances
            instance = $.fancybox.getInstance();

            if (instance) {
                instance.activate();

            } else {
                $W.scrollTop(self.scrollTop).scrollLeft(self.scrollLeft);

                $('html').removeClass('fancybox-enabled');

                $('#fancybox-style-noscroll').remove();
            }

        },


        // Call callback and trigger an event
        // ==================================

        trigger: function(name, slide) {
            var args = Array.prototype.slice.call(arguments, 1),
                self = this,
                obj = slide && slide.opts ? slide : self.current,
                rez;

            if (obj) {
                args.unshift(obj);

            } else {
                obj = self;
            }

            args.unshift(self);

            if ($.isFunction(obj.opts[name])) {
                rez = obj.opts[name].apply(obj, args);
            }

            if (rez === false) {
                return rez;
            }

            if (name === 'afterClose') {
                $D.trigger(name + '.fb', args);

            } else {
                self.$refs.container.trigger(name + '.fb', args);
            }

        },


        // Update infobar values, navigation button states and reveal caption
        // ==================================================================

        updateControls: function(force) {

            var self = this;

            var current = self.current;
            var index = current.index;
            var opts = current.opts;
            var caption = opts.caption;
            var $caption = self.$refs.caption;

            // Recalculate content dimensions
            current.$slide.trigger('refresh');

            self.$caption = caption && caption.length ? $caption.html(caption) : null;

            if (!self.isHiddenControls) {
                self.showControls();
            }

            // Update info and navigation elements
            $('[data-fancybox-count]').html(self.group.length);
            $('[data-fancybox-index]').html(index + 1);

            $('[data-fancybox-prev]').prop('disabled', (!opts.loop && index <= 0));
            $('[data-fancybox-next]').prop('disabled', (!opts.loop && index >= self.group.length - 1));

        },

        // Hide toolbar and caption
        // ========================

        hideControls: function() {

            this.isHiddenControls = true;

            this.$refs.container.removeClass('fancybox-show-infobar fancybox-show-toolbar fancybox-show-caption fancybox-show-nav');

        },

        showControls: function() {

            var self = this;
            var opts = self.current ? self.current.opts : self.opts;
            var $container = self.$refs.container;

            self.isHiddenControls = false;
            self.idleSecondsCounter = 0;

            $container
                .toggleClass('fancybox-show-toolbar', !!(opts.toolbar && opts.buttons))
                .toggleClass('fancybox-show-infobar', !!(opts.infobar && self.group.length > 1))
                .toggleClass('fancybox-show-nav', !!(opts.arrows && self.group.length > 1))
                .toggleClass('fancybox-is-modal', !!opts.modal);

            if (self.$caption) {
                $container.addClass('fancybox-show-caption ');

            } else {
                $container.removeClass('fancybox-show-caption');
            }

        },


        // Toggle toolbar and caption
        // ==========================

        toggleControls: function() {

            if (this.isHiddenControls) {
                this.showControls();

            } else {
                this.hideControls();
            }

        },


    });


    $.fancybox = {

        version: "3.1.28",
        defaults: defaults,


        // Get current instance and execute a command.
        //
        // Examples of usage:
        //
        //   $instance = $.fancybox.getInstance();
        //   $.fancybox.getInstance().jumpTo( 1 );
        //   $.fancybox.getInstance( 'jumpTo', 1 );
        //   $.fancybox.getInstance( function() {
        //       console.info( this.currIndex );
        //   });
        // ======================================================

        getInstance: function(command) {
            var instance = $('.fancybox-container:not(".fancybox-is-closing"):first').data('FancyBox');
            var args = Array.prototype.slice.call(arguments, 1);

            if (instance instanceof FancyBox) {

                if ($.type(command) === 'string') {
                    instance[command].apply(instance, args);

                } else if ($.type(command) === 'function') {
                    command.apply(instance, args);

                }

                return instance;
            }

            return false;

        },


        // Create new instance
        // ===================

        open: function(items, opts, index) {
            return new FancyBox(items, opts, index);
        },


        // Close current or all instances
        // ==============================

        close: function(all) {
            var instance = this.getInstance();

            if (instance) {
                instance.close();

                // Try to find and close next instance

                if (all === true) {
                    this.close();
                }
            }

        },

        // Close instances and unbind all events
        // ==============================

        destroy: function() {

            this.close(true);

            $D.off('click.fb-start');

        },


        // Try to detect mobile devices
        // ============================

        isMobile: document.createTouch !== undefined && /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent),


        // Detect if 'translate3d' support is available
        // ============================================

        use3d: (function() {
            var div = document.createElement('div');

            return window.getComputedStyle && window.getComputedStyle(div).getPropertyValue('transform') && !(document.documentMode && document.documentMode < 11);
        }()),


        // Helper function to get current visual state of an element
        // returns array[ top, left, horizontal-scale, vertical-scale, opacity ]
        // =====================================================================

        getTranslate: function($el) {
            var matrix;

            if (!$el || !$el.length) {
                return false;
            }

            matrix = $el.eq(0).css('transform');

            if (matrix && matrix.indexOf('matrix') !== -1) {
                matrix = matrix.split('(')[1];
                matrix = matrix.split(')')[0];
                matrix = matrix.split(',');
            } else {
                matrix = [];
            }

            if (matrix.length) {

                // If IE
                if (matrix.length > 10) {
                    matrix = [matrix[13], matrix[12], matrix[0], matrix[5]];

                } else {
                    matrix = [matrix[5], matrix[4], matrix[0], matrix[3]];
                }

                matrix = matrix.map(parseFloat);

            } else {
                matrix = [0, 0, 1, 1];

                var transRegex = /\.*translate\((.*)px,(.*)px\)/i;
                var transRez = transRegex.exec($el.eq(0).attr('style'));

                if (transRez) {
                    matrix[0] = parseFloat(transRez[2]);
                    matrix[1] = parseFloat(transRez[1]);
                }
            }

            return {
                top: matrix[0],
                left: matrix[1],
                scaleX: matrix[2],
                scaleY: matrix[3],
                opacity: parseFloat($el.css('opacity')),
                width: $el.width(),
                height: $el.height()
            };

        },


        // Shortcut for setting "translate3d" properties for element
        // Can set be used to set opacity, too
        // ========================================================

        setTranslate: function($el, props) {
            var str = '';
            var css = {};

            if (!$el || !props) {
                return;
            }

            if (props.left !== undefined || props.top !== undefined) {
                str = (props.left === undefined ? $el.position().left : props.left) + 'px, ' + (props.top === undefined ? $el.position().top : props.top) + 'px';

                if (this.use3d) {
                    str = 'translate3d(' + str + ', 0px)';

                } else {
                    str = 'translate(' + str + ')';
                }
            }

            if (props.scaleX !== undefined && props.scaleY !== undefined) {
                str = (str.length ? str + ' ' : '') + 'scale(' + props.scaleX + ', ' + props.scaleY + ')';
            }

            if (str.length) {
                css.transform = str;
            }

            if (props.opacity !== undefined) {
                css.opacity = props.opacity;
            }

            if (props.width !== undefined) {
                css.width = props.width;
            }

            if (props.height !== undefined) {
                css.height = props.height;
            }

            return $el.css(css);
        },


        // Simple CSS transition handler
        // =============================

        animate: function($el, to, duration, callback, leaveAnimationName) {
            var event = transitionEnd || 'transitionend';

            if ($.isFunction(duration)) {
                callback = duration;
                duration = null;
            }

            if (!$.isPlainObject(to)) {
                $el.removeAttr('style');
            }

            $el.on(event, function(e) {

                // Skip events from child elements and z-index change
                if (e && e.originalEvent && (!$el.is(e.originalEvent.target) || e.originalEvent.propertyName == 'z-index')) {
                    return;
                }

                $el.off(event);

                if ($.isPlainObject(to)) {

                    if (to.scaleX !== undefined && to.scaleY !== undefined) {
                        $el.css('transition-duration', '0ms');

                        to.width = Math.round($el.width() * to.scaleX);
                        to.height = Math.round($el.height() * to.scaleY);

                        to.scaleX = 1;
                        to.scaleY = 1;

                        $.fancybox.setTranslate($el, to);
                    }

                } else if (leaveAnimationName !== true) {
                    $el.removeClass(to);
                }

                if ($.isFunction(callback)) {
                    callback(e);
                }

            });

            if ($.isNumeric(duration)) {
                $el.css('transition-duration', duration + 'ms');
            }

            if ($.isPlainObject(to)) {
                $.fancybox.setTranslate($el, to);

            } else {
                $el.addClass(to);
            }

            $el.data("timer", setTimeout(function() {
                $el.trigger('transitionend');
            }, duration + 16));

        },

        stop: function($el) {
            clearTimeout($el.data("timer"));

            $el.off(transitionEnd);
        }

    };


    // Default click handler for "fancyboxed" links
    // ============================================

    function _run(e) {
        var target = e.currentTarget,
            opts = e.data ? e.data.options : {},
            items = opts.selector ? $(opts.selector) : (e.data ? e.data.items : []),
            value = $(target).attr('data-fancybox') || '',
            index = 0,
            active = $.fancybox.getInstance();

        e.preventDefault();

        // Avoid opening multiple times
        if (active && active.current.opts.$orig.is(target)) {
            return;
        }

        // Get all related items and find index for clicked one
        if (value) {
            items = items.length ? items.filter('[data-fancybox="' + value + '"]') : $('[data-fancybox="' + value + '"]');
            index = items.index(target);

            // Sometimes current item can not be found
            // (for example, when slider clones items)
            if (index < 0) {
                index = 0;
            }

        } else {
            items = [target];
        }

        $.fancybox.open(items, opts, index);
    }


    // Create a jQuery plugin
    // ======================

    $.fn.fancybox = function(options) {
        var selector;

        options = options || {};
        selector = options.selector || false;

        if (selector) {

            $('body').off('click.fb-start', selector).on('click.fb-start', selector, {
                options: options
            }, _run);

        } else {

            this.off('click.fb-start').on('click.fb-start', {
                items: this,
                options: options
            }, _run);

        }

        return this;
    };


    // Self initializing plugin
    // ========================

    $D.on('click.fb-start', '[data-fancybox]', _run);

}(window, document, window.jQuery || jQuery));

// ==========================================================================
//
// Media
// Adds additional media type support
//
// ==========================================================================
;
(function($) {

    'use strict';

    // Formats matching url to final form

    var format = function(url, rez, params) {
        if (!url) {
            return;
        }

        params = params || '';

        if ($.type(params) === "object") {
            params = $.param(params, true);
        }

        $.each(rez, function(key, value) {
            url = url.replace('$' + key, value || '');
        });

        if (params.length) {
            url += (url.indexOf('?') > 0 ? '&' : '?') + params;
        }

        return url;
    };

    // Object containing properties for each media type

    var defaults = {
        youtube: {
            matcher: /(youtube\.com|youtu\.be|youtube\-nocookie\.com)\/(watch\?(.*&)?v=|v\/|u\/|embed\/?)?(videoseries\?list=(.*)|[\w-]{11}|\?listType=(.*)&list=(.*))(.*)/i,
            params: {
                autoplay: 1,
                autohide: 1,
                fs: 1,
                rel: 0,
                hd: 1,
                wmode: 'transparent',
                enablejsapi: 1,
                html5: 1
            },
            paramPlace: 8,
            type: 'iframe',
            url: '//www.youtube.com/embed/$4',
            thumb: '//img.youtube.com/vi/$4/hqdefault.jpg'
        },

        vimeo: {
            matcher: /^.+vimeo.com\/(.*\/)?([\d]+)(.*)?/,
            params: {
                autoplay: 1,
                hd: 1,
                show_title: 1,
                show_byline: 1,
                show_portrait: 0,
                fullscreen: 1,
                api: 1
            },
            paramPlace: 3,
            type: 'iframe',
            url: '//player.vimeo.com/video/$2'
        },

        metacafe: {
            matcher: /metacafe.com\/watch\/(\d+)\/(.*)?/,
            type: 'iframe',
            url: '//www.metacafe.com/embed/$1/?ap=1'
        },

        dailymotion: {
            matcher: /dailymotion.com\/video\/(.*)\/?(.*)/,
            params: {
                additionalInfos: 0,
                autoStart: 1
            },
            type: 'iframe',
            url: '//www.dailymotion.com/embed/video/$1'
        },

        vine: {
            matcher: /vine.co\/v\/([a-zA-Z0-9\?\=\-]+)/,
            type: 'iframe',
            url: '//vine.co/v/$1/embed/simple'
        },

        instagram: {
            matcher: /(instagr\.am|instagram\.com)\/p\/([a-zA-Z0-9_\-]+)\/?/i,
            type: 'image',
            url: '//$1/p/$2/media/?size=l'
        },

        // Examples:
        // http://maps.google.com/?ll=48.857995,2.294297&spn=0.007666,0.021136&t=m&z=16
        // https://www.google.com/maps/@37.7852006,-122.4146355,14.65z
        // https://www.google.com/maps/place/Googleplex/@37.4220041,-122.0833494,17z/data=!4m5!3m4!1s0x0:0x6c296c66619367e0!8m2!3d37.4219998!4d-122.0840572
        gmap_place: {
            matcher: /(maps\.)?google\.([a-z]{2,3}(\.[a-z]{2})?)\/(((maps\/(place\/(.*)\/)?\@(.*),(\d+.?\d+?)z))|(\?ll=))(.*)?/i,
            type: 'iframe',
            url: function(rez) {
                return '//maps.google.' + rez[2] + '/?ll=' + (rez[9] ? rez[9] + '&z=' + Math.floor(rez[10]) + (rez[12] ? rez[12].replace(/^\//, "&") : '') : rez[12]) + '&output=' + (rez[12] && rez[12].indexOf('layer=c') > 0 ? 'svembed' : 'embed');
            }
        },

        // Examples:
        // https://www.google.com/maps/search/Empire+State+Building/
        // https://www.google.com/maps/search/?api=1&query=centurylink+field
        // https://www.google.com/maps/search/?api=1&query=47.5951518,-122.3316393
        gmap_search: {
            matcher: /(maps\.)?google\.([a-z]{2,3}(\.[a-z]{2})?)\/(maps\/search\/)(.*)/i,
            type: 'iframe',
            url: function(rez) {
                return '//maps.google.' + rez[2] + '/maps?q=' + rez[5].replace('query=', 'q=').replace('api=1', '') + '&output=embed';
            }
        }
    };

    $(document).on('onInit.fb', function(e, instance) {

        $.each(instance.group, function(i, item) {

            var url = item.src || '',
                type = false,
                media,
                thumb,
                rez,
                params,
                urlParams,
                o,
                provider;

            // Skip items that already have content type
            if (item.type) {
                return;
            }

            media = $.extend(true, {}, defaults, item.opts.media);

            // Look for any matching media type
            $.each(media, function(n, el) {
                rez = url.match(el.matcher);
                o = {};
                provider = n;

                if (!rez) {
                    return;
                }

                type = el.type;

                if (el.paramPlace && rez[el.paramPlace]) {
                    urlParams = rez[el.paramPlace];

                    if (urlParams[0] == '?') {
                        urlParams = urlParams.substring(1);
                    }

                    urlParams = urlParams.split('&');

                    for (var m = 0; m < urlParams.length; ++m) {
                        var p = urlParams[m].split('=', 2);

                        if (p.length == 2) {
                            o[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
                        }
                    }
                }

                params = $.extend(true, {}, el.params, item.opts[n], o);

                url = $.type(el.url) === "function" ? el.url.call(this, rez, params, item) : format(el.url, rez, params);
                thumb = $.type(el.thumb) === "function" ? el.thumb.call(this, rez, params, item) : format(el.thumb, rez);

                if (provider === 'vimeo') {
                    url = url.replace('&%23', '#');
                }

                return false;
            });

            // If it is found, then change content type and update the url

            if (type) {
                item.src = url;
                item.type = type;

                if (!item.opts.thumb && !(item.opts.$thumb && item.opts.$thumb.length)) {
                    item.opts.thumb = thumb;
                }

                if (type === 'iframe') {
                    $.extend(true, item.opts, {
                        iframe: {
                            preload: false,
                            attr: {
                                scrolling: "no"
                            }
                        }
                    });

                    item.contentProvider = provider;

                    item.opts.slideClass += ' fancybox-slide--' + (provider == 'gmap_place' || provider == 'gmap_search' ? 'map' : 'video');
                }

            } else {

                // If no content type is found, then set it to `image` as fallback
                item.type = 'image';
            }

        });

    });

}(window.jQuery));

// ==========================================================================
//
// Guestures
// Adds touch guestures, handles click and tap events
//
// ==========================================================================
;
(function(window, document, $) {
    'use strict';

    var requestAFrame = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            // if all else fails, use setTimeout
            function(callback) {
                return window.setTimeout(callback, 1000 / 60);
            };
    })();


    var cancelAFrame = (function() {
        return window.cancelAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            window.mozCancelAnimationFrame ||
            window.oCancelAnimationFrame ||
            function(id) {
                window.clearTimeout(id);
            };
    })();


    var pointers = function(e) {
        var result = [];

        e = e.originalEvent || e || window.e;
        e = e.touches && e.touches.length ? e.touches : (e.changedTouches && e.changedTouches.length ? e.changedTouches : [e]);

        for (var key in e) {

            if (e[key].pageX) {
                result.push({ x: e[key].pageX, y: e[key].pageY });

            } else if (e[key].clientX) {
                result.push({ x: e[key].clientX, y: e[key].clientY });
            }
        }

        return result;
    };

    var distance = function(point2, point1, what) {
        if (!point1 || !point2) {
            return 0;
        }

        if (what === 'x') {
            return point2.x - point1.x;

        } else if (what === 'y') {
            return point2.y - point1.y;
        }

        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    };

    var isClickable = function($el) {

        if ($el.is('a,button,input,select,textarea,label') || $.isFunction($el.get(0).onclick) || $el.data('selectable')) {
            return true;
        }

        // Check for attributes like data-fancybox-next or data-fancybox-close
        for (var i = 0, atts = $el[0].attributes, n = atts.length; i < n; i++) {
            if (atts[i].nodeName.substr(0, 14) === 'data-fancybox-') {
                return true;
            }
        }

        return false;
    };

    var hasScrollbars = function(el) {
        var overflowY = window.getComputedStyle(el)['overflow-y'];
        var overflowX = window.getComputedStyle(el)['overflow-x'];

        var vertical = (overflowY === 'scroll' || overflowY === 'auto') && el.scrollHeight > el.clientHeight;
        var horizontal = (overflowX === 'scroll' || overflowX === 'auto') && el.scrollWidth > el.clientWidth;

        return vertical || horizontal;
    };

    var isScrollable = function($el) {
        var rez = false;

        while (true) {
            rez = hasScrollbars($el.get(0));

            if (rez) {
                break;
            }

            $el = $el.parent();

            if (!$el.length || $el.hasClass('fancybox-stage') || $el.is('body')) {
                break;
            }
        }

        return rez;
    };


    var Guestures = function(instance) {
        var self = this;

        self.instance = instance;

        self.$bg = instance.$refs.bg;
        self.$stage = instance.$refs.stage;
        self.$container = instance.$refs.container;

        self.destroy();

        self.$container.on('touchstart.fb.touch mousedown.fb.touch', $.proxy(self, 'ontouchstart'));
    };

    Guestures.prototype.destroy = function() {
        this.$container.off('.fb.touch');
    };

    Guestures.prototype.ontouchstart = function(e) {
        var self = this;

        var $target = $(e.target);
        var instance = self.instance;
        var current = instance.current;
        var $content = current.$content;

        var isTouchDevice = (e.type == 'touchstart');

        // Do not respond to both events
        if (isTouchDevice) {
            self.$container.off('mousedown.fb.touch');
        }

        // Ignore clicks while zooming or closing
        if (!current || self.instance.isAnimating || self.instance.isClosing) {
            e.stopPropagation();
            e.preventDefault();

            return;
        }

        // Ignore right click
        if (e.originalEvent && e.originalEvent.button == 2) {
            return;
        }

        // Ignore taping on links, buttons, input elements
        if (!$target.length || isClickable($target) || isClickable($target.parent())) {
            return;
        }

        // Ignore clicks on the scrollbar
        if (e.originalEvent.clientX > $target[0].clientWidth + $target.offset().left) {
            return;
        }

        self.startPoints = pointers(e);

        // Prevent zooming if already swiping
        if (!self.startPoints || (self.startPoints.length > 1 && instance.isSliding)) {
            return;
        }

        self.$target = $target;
        self.$content = $content;
        self.canTap = true;

        $(document).off('.fb.touch');

        $(document).on(isTouchDevice ? 'touchend.fb.touch touchcancel.fb.touch' : 'mouseup.fb.touch mouseleave.fb.touch', $.proxy(self, "ontouchend"));
        $(document).on(isTouchDevice ? 'touchmove.fb.touch' : 'mousemove.fb.touch', $.proxy(self, "ontouchmove"));

        if (!(instance.current.opts.touch || instance.canPan()) || !($target.is(self.$stage) || self.$stage.find($target).length)) {

            // Prevent ghosting
            if ($target.is('img')) {
                e.preventDefault();
            }

            return;
        }

        e.stopPropagation();

        if (!($.fancybox.isMobile && (isScrollable(self.$target) || isScrollable(self.$target.parent())))) {
            e.preventDefault();
        }

        self.canvasWidth = Math.round(current.$slide[0].clientWidth);
        self.canvasHeight = Math.round(current.$slide[0].clientHeight);

        self.startTime = new Date().getTime();
        self.distanceX = self.distanceY = self.distance = 0;

        self.isPanning = false;
        self.isSwiping = false;
        self.isZooming = false;

        self.sliderStartPos = self.sliderLastPos || { top: 0, left: 0 };
        self.contentStartPos = $.fancybox.getTranslate(self.$content);
        self.contentLastPos = null;

        if (self.startPoints.length === 1 && !self.isZooming) {
            self.canTap = !instance.isSliding;

            if (current.type === 'image' && (self.contentStartPos.width > self.canvasWidth + 1 || self.contentStartPos.height > self.canvasHeight + 1)) {

                $.fancybox.stop(self.$content);

                self.$content.css('transition-duration', '0ms');

                self.isPanning = true;

            } else {

                self.isSwiping = true;
            }

            self.$container.addClass('fancybox-controls--isGrabbing');
        }

        if (self.startPoints.length === 2 && !instance.isAnimating && !current.hasError && current.type === 'image' && (current.isLoaded || current.$ghost)) {
            self.isZooming = true;

            self.isSwiping = false;
            self.isPanning = false;

            $.fancybox.stop(self.$content);

            self.$content.css('transition-duration', '0ms');

            self.centerPointStartX = ((self.startPoints[0].x + self.startPoints[1].x) * 0.5) - $(window).scrollLeft();
            self.centerPointStartY = ((self.startPoints[0].y + self.startPoints[1].y) * 0.5) - $(window).scrollTop();

            self.percentageOfImageAtPinchPointX = (self.centerPointStartX - self.contentStartPos.left) / self.contentStartPos.width;
            self.percentageOfImageAtPinchPointY = (self.centerPointStartY - self.contentStartPos.top) / self.contentStartPos.height;

            self.startDistanceBetweenFingers = distance(self.startPoints[0], self.startPoints[1]);
        }

    };

    Guestures.prototype.ontouchmove = function(e) {

        var self = this;

        self.newPoints = pointers(e);

        if ($.fancybox.isMobile && (isScrollable(self.$target) || isScrollable(self.$target.parent()))) {
            e.stopPropagation();

            self.canTap = false;

            return;
        }

        if (!(self.instance.current.opts.touch || self.instance.canPan()) || !self.newPoints || !self.newPoints.length) {
            return;
        }

        self.distanceX = distance(self.newPoints[0], self.startPoints[0], 'x');
        self.distanceY = distance(self.newPoints[0], self.startPoints[0], 'y');

        self.distance = distance(self.newPoints[0], self.startPoints[0]);

        // Skip false ontouchmove events (Chrome)
        if (self.distance > 0) {

            if (!(self.$target.is(self.$stage) || self.$stage.find(self.$target).length)) {
                return;
            }

            e.stopPropagation();
            e.preventDefault();

            if (self.isSwiping) {
                self.onSwipe();

            } else if (self.isPanning) {
                self.onPan();

            } else if (self.isZooming) {
                self.onZoom();
            }

        }

    };

    Guestures.prototype.onSwipe = function() {

        var self = this;

        var swiping = self.isSwiping;
        var left = self.sliderStartPos.left || 0;
        var angle;

        if (swiping === true) {

            if (Math.abs(self.distance) > 10) {

                self.canTap = false;

                if (self.instance.group.length < 2 && self.instance.opts.touch.vertical) {
                    self.isSwiping = 'y';

                } else if (self.instance.isSliding || self.instance.opts.touch.vertical === false || (self.instance.opts.touch.vertical === 'auto' && $(window).width() > 800)) {
                    self.isSwiping = 'x';

                } else {
                    angle = Math.abs(Math.atan2(self.distanceY, self.distanceX) * 180 / Math.PI);

                    self.isSwiping = (angle > 45 && angle < 135) ? 'y' : 'x';
                }

                self.instance.isSliding = self.isSwiping;

                // Reset points to avoid jumping, because we dropped first swipes to calculate the angle
                self.startPoints = self.newPoints;

                $.each(self.instance.slides, function(index, slide) {
                    $.fancybox.stop(slide.$slide);

                    slide.$slide.css('transition-duration', '0ms');

                    slide.inTransition = false;

                    if (slide.pos === self.instance.current.pos) {
                        self.sliderStartPos.left = $.fancybox.getTranslate(slide.$slide).left;
                    }
                });

                //self.instance.current.isMoved = true;

                // Stop slideshow
                if (self.instance.SlideShow && self.instance.SlideShow.isActive) {
                    self.instance.SlideShow.stop();
                }
            }

        } else {

            if (swiping == 'x') {

                // Sticky edges
                if (self.distanceX > 0 && (self.instance.group.length < 2 || (self.instance.current.index === 0 && !self.instance.current.opts.loop))) {
                    left = left + Math.pow(self.distanceX, 0.8);

                } else if (self.distanceX < 0 && (self.instance.group.length < 2 || (self.instance.current.index === self.instance.group.length - 1 && !self.instance.current.opts.loop))) {
                    left = left - Math.pow(-self.distanceX, 0.8);

                } else {
                    left = left + self.distanceX;
                }

            }

            self.sliderLastPos = {
                top: swiping == 'x' ? 0 : self.sliderStartPos.top + self.distanceY,
                left: left
            };

            if (self.requestId) {
                cancelAFrame(self.requestId);

                self.requestId = null;
            }

            self.requestId = requestAFrame(function() {

                if (self.sliderLastPos) {
                    $.each(self.instance.slides, function(index, slide) {
                        var pos = slide.pos - self.instance.currPos;

                        $.fancybox.setTranslate(slide.$slide, {
                            top: self.sliderLastPos.top,
                            left: self.sliderLastPos.left + (pos * self.canvasWidth) + (pos * slide.opts.gutter)
                        });
                    });

                    self.$container.addClass('fancybox-is-sliding');
                }

            });

        }

    };

    Guestures.prototype.onPan = function() {

        var self = this;

        var newOffsetX, newOffsetY, newPos;

        self.canTap = false;

        if (self.contentStartPos.width > self.canvasWidth) {
            newOffsetX = self.contentStartPos.left + self.distanceX;

        } else {
            newOffsetX = self.contentStartPos.left;
        }

        newOffsetY = self.contentStartPos.top + self.distanceY;

        newPos = self.limitMovement(newOffsetX, newOffsetY, self.contentStartPos.width, self.contentStartPos.height);

        newPos.scaleX = self.contentStartPos.scaleX;
        newPos.scaleY = self.contentStartPos.scaleY;

        self.contentLastPos = newPos;

        if (self.requestId) {
            cancelAFrame(self.requestId);

            self.requestId = null;
        }

        self.requestId = requestAFrame(function() {
            $.fancybox.setTranslate(self.$content, self.contentLastPos);
        });
    };

    // Make panning sticky to the edges
    Guestures.prototype.limitMovement = function(newOffsetX, newOffsetY, newWidth, newHeight) {

        var self = this;

        var minTranslateX, minTranslateY, maxTranslateX, maxTranslateY;

        var canvasWidth = self.canvasWidth;
        var canvasHeight = self.canvasHeight;

        var currentOffsetX = self.contentStartPos.left;
        var currentOffsetY = self.contentStartPos.top;

        var distanceX = self.distanceX;
        var distanceY = self.distanceY;

        // Slow down proportionally to traveled distance

        minTranslateX = Math.max(0, canvasWidth * 0.5 - newWidth * 0.5);
        minTranslateY = Math.max(0, canvasHeight * 0.5 - newHeight * 0.5);

        maxTranslateX = Math.min(canvasWidth - newWidth, canvasWidth * 0.5 - newWidth * 0.5);
        maxTranslateY = Math.min(canvasHeight - newHeight, canvasHeight * 0.5 - newHeight * 0.5);

        if (newWidth > canvasWidth) {

            //   ->
            if (distanceX > 0 && newOffsetX > minTranslateX) {
                newOffsetX = minTranslateX - 1 + Math.pow(-minTranslateX + currentOffsetX + distanceX, 0.8) || 0;
            }

            //    <-
            if (distanceX < 0 && newOffsetX < maxTranslateX) {
                newOffsetX = maxTranslateX + 1 - Math.pow(maxTranslateX - currentOffsetX - distanceX, 0.8) || 0;
            }

        }

        if (newHeight > canvasHeight) {

            //   \/
            if (distanceY > 0 && newOffsetY > minTranslateY) {
                newOffsetY = minTranslateY - 1 + Math.pow(-minTranslateY + currentOffsetY + distanceY, 0.8) || 0;
            }

            //   /\
            if (distanceY < 0 && newOffsetY < maxTranslateY) {
                newOffsetY = maxTranslateY + 1 - Math.pow(maxTranslateY - currentOffsetY - distanceY, 0.8) || 0;
            }

        }

        return {
            top: newOffsetY,
            left: newOffsetX
        };

    };


    Guestures.prototype.limitPosition = function(newOffsetX, newOffsetY, newWidth, newHeight) {

        var self = this;

        var canvasWidth = self.canvasWidth;
        var canvasHeight = self.canvasHeight;

        if (newWidth > canvasWidth) {
            newOffsetX = newOffsetX > 0 ? 0 : newOffsetX;
            newOffsetX = newOffsetX < canvasWidth - newWidth ? canvasWidth - newWidth : newOffsetX;

        } else {

            // Center horizontally
            newOffsetX = Math.max(0, canvasWidth / 2 - newWidth / 2);

        }

        if (newHeight > canvasHeight) {
            newOffsetY = newOffsetY > 0 ? 0 : newOffsetY;
            newOffsetY = newOffsetY < canvasHeight - newHeight ? canvasHeight - newHeight : newOffsetY;

        } else {

            // Center vertically
            newOffsetY = Math.max(0, canvasHeight / 2 - newHeight / 2);

        }

        return {
            top: newOffsetY,
            left: newOffsetX
        };

    };

    Guestures.prototype.onZoom = function() {

        var self = this;

        // Calculate current distance between points to get pinch ratio and new width and height

        var currentWidth = self.contentStartPos.width;
        var currentHeight = self.contentStartPos.height;

        var currentOffsetX = self.contentStartPos.left;
        var currentOffsetY = self.contentStartPos.top;

        var endDistanceBetweenFingers = distance(self.newPoints[0], self.newPoints[1]);

        var pinchRatio = endDistanceBetweenFingers / self.startDistanceBetweenFingers;

        var newWidth = Math.floor(currentWidth * pinchRatio);
        var newHeight = Math.floor(currentHeight * pinchRatio);

        // This is the translation due to pinch-zooming
        var translateFromZoomingX = (currentWidth - newWidth) * self.percentageOfImageAtPinchPointX;
        var translateFromZoomingY = (currentHeight - newHeight) * self.percentageOfImageAtPinchPointY;

        //Point between the two touches

        var centerPointEndX = ((self.newPoints[0].x + self.newPoints[1].x) / 2) - $(window).scrollLeft();
        var centerPointEndY = ((self.newPoints[0].y + self.newPoints[1].y) / 2) - $(window).scrollTop();

        // And this is the translation due to translation of the centerpoint
        // between the two fingers

        var translateFromTranslatingX = centerPointEndX - self.centerPointStartX;
        var translateFromTranslatingY = centerPointEndY - self.centerPointStartY;

        // The new offset is the old/current one plus the total translation

        var newOffsetX = currentOffsetX + (translateFromZoomingX + translateFromTranslatingX);
        var newOffsetY = currentOffsetY + (translateFromZoomingY + translateFromTranslatingY);

        var newPos = {
            top: newOffsetY,
            left: newOffsetX,
            scaleX: self.contentStartPos.scaleX * pinchRatio,
            scaleY: self.contentStartPos.scaleY * pinchRatio
        };

        self.canTap = false;

        self.newWidth = newWidth;
        self.newHeight = newHeight;

        self.contentLastPos = newPos;

        if (self.requestId) {
            cancelAFrame(self.requestId);

            self.requestId = null;
        }

        self.requestId = requestAFrame(function() {
            $.fancybox.setTranslate(self.$content, self.contentLastPos);
        });

    };

    Guestures.prototype.ontouchend = function(e) {

        var self = this;
        var dMs = Math.max((new Date().getTime()) - self.startTime, 1);

        var swiping = self.isSwiping;
        var panning = self.isPanning;
        var zooming = self.isZooming;

        self.endPoints = pointers(e);

        self.$container.removeClass('fancybox-controls--isGrabbing');

        $(document).off('.fb.touch');

        if (self.requestId) {
            cancelAFrame(self.requestId);

            self.requestId = null;
        }

        self.isSwiping = false;
        self.isPanning = false;
        self.isZooming = false;

        if (self.canTap) {
            return self.onTap(e);
        }

        self.speed = 366;

        // Speed in px/ms
        self.velocityX = self.distanceX / dMs * 0.5;
        self.velocityY = self.distanceY / dMs * 0.5;

        self.speedX = Math.max(self.speed * 0.5, Math.min(self.speed * 1.5, (1 / Math.abs(self.velocityX)) * self.speed));

        if (panning) {
            self.endPanning();

        } else if (zooming) {
            self.endZooming();

        } else {
            self.endSwiping(swiping);
        }

        return;
    };

    Guestures.prototype.endSwiping = function(swiping) {

        var self = this;
        var ret = false;

        self.instance.isSliding = false;
        self.sliderLastPos = null;

        // Close if swiped vertically / navigate if horizontally
        if (swiping == 'y' && Math.abs(self.distanceY) > 50) {

            // Continue vertical movement
            $.fancybox.animate(self.instance.current.$slide, {
                top: self.sliderStartPos.top + self.distanceY + (self.velocityY * 150),
                opacity: 0
            }, 150);

            ret = self.instance.close(true, 300);

        } else if (swiping == 'x' && self.distanceX > 50 && self.instance.group.length > 1) {
            ret = self.instance.previous(self.speedX);

        } else if (swiping == 'x' && self.distanceX < -50 && self.instance.group.length > 1) {
            ret = self.instance.next(self.speedX);
        }

        if (ret === false && (swiping == 'x' || swiping == 'y')) {
            self.instance.jumpTo(self.instance.current.index, 150);
        }

        self.$container.removeClass('fancybox-is-sliding');

    };

    // Limit panning from edges
    // ========================

    Guestures.prototype.endPanning = function() {

        var self = this;
        var newOffsetX, newOffsetY, newPos;

        if (!self.contentLastPos) {
            return;
        }

        if (self.instance.current.opts.touch.momentum === false) {
            newOffsetX = self.contentLastPos.left;
            newOffsetY = self.contentLastPos.top;

        } else {

            // Continue movement
            newOffsetX = self.contentLastPos.left + (self.velocityX * self.speed);
            newOffsetY = self.contentLastPos.top + (self.velocityY * self.speed);
        }

        newPos = self.limitPosition(newOffsetX, newOffsetY, self.contentStartPos.width, self.contentStartPos.height);

        newPos.width = self.contentStartPos.width;
        newPos.height = self.contentStartPos.height;

        $.fancybox.animate(self.$content, newPos, 330);
    };


    Guestures.prototype.endZooming = function() {

        var self = this;

        var current = self.instance.current;

        var newOffsetX, newOffsetY, newPos, reset;

        var newWidth = self.newWidth;
        var newHeight = self.newHeight;

        if (!self.contentLastPos) {
            return;
        }

        newOffsetX = self.contentLastPos.left;
        newOffsetY = self.contentLastPos.top;

        reset = {
            top: newOffsetY,
            left: newOffsetX,
            width: newWidth,
            height: newHeight,
            scaleX: 1,
            scaleY: 1
        };

        // Reset scalex/scaleY values; this helps for perfomance and does not break animation
        $.fancybox.setTranslate(self.$content, reset);

        if (newWidth < self.canvasWidth && newHeight < self.canvasHeight) {
            self.instance.scaleToFit(150);

        } else if (newWidth > current.width || newHeight > current.height) {
            self.instance.scaleToActual(self.centerPointStartX, self.centerPointStartY, 150);

        } else {

            newPos = self.limitPosition(newOffsetX, newOffsetY, newWidth, newHeight);

            // Switch from scale() to width/height or animation will not work correctly
            $.fancybox.setTranslate(self.content, $.fancybox.getTranslate(self.$content));

            $.fancybox.animate(self.$content, newPos, 150);
        }

    };

    Guestures.prototype.onTap = function(e) {
        var self = this;
        var $target = $(e.target);

        var instance = self.instance;
        var current = instance.current;

        var endPoints = (e && pointers(e)) || self.startPoints;

        var tapX = endPoints[0] ? endPoints[0].x - self.$stage.offset().left : 0;
        var tapY = endPoints[0] ? endPoints[0].y - self.$stage.offset().top : 0;

        var where;

        var process = function(prefix) {

            var action = current.opts[prefix];

            if ($.isFunction(action)) {
                action = action.apply(instance, [current, e]);
            }

            if (!action) {
                return;
            }

            switch (action) {

                case "close":

                    instance.close(self.startEvent);

                    break;

                case "toggleControls":

                    instance.toggleControls(true);

                    break;

                case "next":

                    instance.next();

                    break;

                case "nextOrClose":

                    if (instance.group.length > 1) {
                        instance.next();

                    } else {
                        instance.close(self.startEvent);
                    }

                    break;

                case "zoom":

                    if (current.type == 'image' && (current.isLoaded || current.$ghost)) {

                        if (instance.canPan()) {
                            instance.scaleToFit();

                        } else if (instance.isScaledDown()) {
                            instance.scaleToActual(tapX, tapY);

                        } else if (instance.group.length < 2) {
                            instance.close(self.startEvent);
                        }
                    }

                    break;
            }

        };

        // Ignore right click
        if (e.originalEvent && e.originalEvent.button == 2) {
            return;
        }

        // Skip if current slide is not in the center
        if (instance.isSliding) {
            return;
        }

        // Skip if clicked on the scrollbar
        if (tapX > $target[0].clientWidth + $target.offset().left) {
            return;
        }

        // Check where is clicked
        if ($target.is('.fancybox-bg,.fancybox-inner,.fancybox-outer,.fancybox-container')) {
            where = 'Outside';

        } else if ($target.is('.fancybox-slide')) {
            where = 'Slide';

        } else if (instance.current.$content && instance.current.$content.has(e.target).length) {
            where = 'Content';

        } else {
            return;
        }

        // Check if this is a double tap
        if (self.tapped) {

            // Stop previously created single tap
            clearTimeout(self.tapped);
            self.tapped = null;

            // Skip if distance between taps is too big
            if (Math.abs(tapX - self.tapX) > 50 || Math.abs(tapY - self.tapY) > 50 || instance.isSliding) {
                return this;
            }

            // OK, now we assume that this is a double-tap
            process('dblclick' + where);

        } else {

            // Single tap will be processed if user has not clicked second time within 300ms
            // or there is no need to wait for double-tap
            self.tapX = tapX;
            self.tapY = tapY;

            if (current.opts['dblclick' + where] && current.opts['dblclick' + where] !== current.opts['click' + where]) {
                self.tapped = setTimeout(function() {
                    self.tapped = null;

                    process('click' + where);

                }, 300);

            } else {
                process('click' + where);
            }

        }

        return this;
    };

    $(document).on('onActivate.fb', function(e, instance) {
        if (instance && !instance.Guestures) {
            instance.Guestures = new Guestures(instance);
        }
    });

    $(document).on('beforeClose.fb', function(e, instance) {
        if (instance && instance.Guestures) {
            instance.Guestures.destroy();
        }
    });


}(window, document, window.jQuery));

// ==========================================================================
//
// SlideShow
// Enables slideshow functionality
//
// Example of usage:
// $.fancybox.getInstance().SlideShow.start()
//
// ==========================================================================
;
(function(document, $) {
    'use strict';

    var SlideShow = function(instance) {
        this.instance = instance;
        this.init();
    };

    $.extend(SlideShow.prototype, {
        timer: null,
        isActive: false,
        $button: null,
        speed: 3000,

        init: function() {
            var self = this;

            self.$button = self.instance.$refs.toolbar.find('[data-fancybox-play]').on('click', function() {
                self.toggle();
            });

            if (self.instance.group.length < 2 || !self.instance.group[self.instance.currIndex].opts.slideShow) {
                self.$button.hide();
            }
        },

        set: function() {
            var self = this;

            // Check if reached last element
            if (self.instance && self.instance.current && (self.instance.current.opts.loop || self.instance.currIndex < self.instance.group.length - 1)) {
                self.timer = setTimeout(function() {
                    self.instance.next();

                }, self.instance.current.opts.slideShow.speed || self.speed);

            } else {
                self.stop();
                self.instance.idleSecondsCounter = 0;
                self.instance.showControls();
            }

        },

        clear: function() {
            var self = this;

            clearTimeout(self.timer);

            self.timer = null;
        },

        start: function() {
            var self = this;
            var current = self.instance.current;

            if (self.instance && current && (current.opts.loop || current.index < self.instance.group.length - 1)) {

                self.isActive = true;

                self.$button
                    .attr('title', current.opts.i18n[current.opts.lang].PLAY_STOP)
                    .addClass('fancybox-button--pause');

                if (current.isComplete) {
                    self.set();
                }
            }
        },

        stop: function() {
            var self = this;
            var current = self.instance.current;

            self.clear();

            self.$button
                .attr('title', current.opts.i18n[current.opts.lang].PLAY_START)
                .removeClass('fancybox-button--pause');

            self.isActive = false;
        },

        toggle: function() {
            var self = this;

            if (self.isActive) {
                self.stop();

            } else {
                self.start();
            }
        }

    });

    $(document).on({
        'onInit.fb': function(e, instance) {
            if (instance && !instance.SlideShow) {
                instance.SlideShow = new SlideShow(instance);
            }
        },

        'beforeShow.fb': function(e, instance, current, firstRun) {
            var SlideShow = instance && instance.SlideShow;

            if (firstRun) {

                if (SlideShow && current.opts.slideShow.autoStart) {
                    SlideShow.start();
                }

            } else if (SlideShow && SlideShow.isActive) {
                SlideShow.clear();
            }
        },

        'afterShow.fb': function(e, instance, current) {
            var SlideShow = instance && instance.SlideShow;

            if (SlideShow && SlideShow.isActive) {
                SlideShow.set();
            }
        },

        'afterKeydown.fb': function(e, instance, current, keypress, keycode) {
            var SlideShow = instance && instance.SlideShow;

            // "P" or Spacebar
            if (SlideShow && current.opts.slideShow && (keycode === 80 || keycode === 32) && !$(document.activeElement).is('button,a,input')) {
                keypress.preventDefault();

                SlideShow.toggle();
            }
        },

        'beforeClose.fb onDeactivate.fb': function(e, instance) {
            var SlideShow = instance && instance.SlideShow;

            if (SlideShow) {
                SlideShow.stop();
            }
        }
    });

    // Page Visibility API to pause slideshow when window is not active
    $(document).on("visibilitychange", function() {
        var instance = $.fancybox.getInstance();
        var SlideShow = instance && instance.SlideShow;

        if (SlideShow && SlideShow.isActive) {
            if (document.hidden) {
                SlideShow.clear();

            } else {
                SlideShow.set();
            }
        }
    });

}(document, window.jQuery));

// ==========================================================================
//
// FullScreen
// Adds fullscreen functionality
//
// ==========================================================================
;
(function(document, $) {
    'use strict';

    // Collection of methods supported by user browser
    var fn = (function() {

        var fnMap = [
            [
                'requestFullscreen',
                'exitFullscreen',
                'fullscreenElement',
                'fullscreenEnabled',
                'fullscreenchange',
                'fullscreenerror'
            ],
            // new WebKit
            [
                'webkitRequestFullscreen',
                'webkitExitFullscreen',
                'webkitFullscreenElement',
                'webkitFullscreenEnabled',
                'webkitfullscreenchange',
                'webkitfullscreenerror'

            ],
            // old WebKit (Safari 5.1)
            [
                'webkitRequestFullScreen',
                'webkitCancelFullScreen',
                'webkitCurrentFullScreenElement',
                'webkitCancelFullScreen',
                'webkitfullscreenchange',
                'webkitfullscreenerror'

            ],
            [
                'mozRequestFullScreen',
                'mozCancelFullScreen',
                'mozFullScreenElement',
                'mozFullScreenEnabled',
                'mozfullscreenchange',
                'mozfullscreenerror'
            ],
            [
                'msRequestFullscreen',
                'msExitFullscreen',
                'msFullscreenElement',
                'msFullscreenEnabled',
                'MSFullscreenChange',
                'MSFullscreenError'
            ]
        ];

        var val;
        var ret = {};
        var i, j;

        for (i = 0; i < fnMap.length; i++) {
            val = fnMap[i];

            if (val && val[1] in document) {
                for (j = 0; j < val.length; j++) {
                    ret[fnMap[0][j]] = val[j];
                }

                return ret;
            }
        }

        return false;
    })();

    // If browser does not have Full Screen API, then simply unset default button template and stop
    if (!fn) {

        if ($ && $.fancybox) {
            $.fancybox.defaults.btnTpl.fullScreen = false;
        }

        return;
    }

    var FullScreen = {

        request: function(elem) {

            elem = elem || document.documentElement;

            elem[fn.requestFullscreen](elem.ALLOW_KEYBOARD_INPUT);

        },
        exit: function() {

            document[fn.exitFullscreen]();

        },
        toggle: function(elem) {

            elem = elem || document.documentElement;

            if (this.isFullscreen()) {
                this.exit();

            } else {
                this.request(elem);
            }

        },
        isFullscreen: function() {

            return Boolean(document[fn.fullscreenElement]);

        },
        enabled: function() {

            return Boolean(document[fn.fullscreenEnabled]);

        }
    };

    $(document).on({
        'onInit.fb': function(e, instance) {
            var $container;

            var $button = instance.$refs.toolbar.find('[data-fancybox-fullscreen]');

            if (instance && !instance.FullScreen && instance.group[instance.currIndex].opts.fullScreen) {
                $container = instance.$refs.container;

                $container.on('click.fb-fullscreen', '[data-fancybox-fullscreen]', function(e) {

                    e.stopPropagation();
                    e.preventDefault();

                    FullScreen.toggle($container[0]);

                });

                if (instance.opts.fullScreen && instance.opts.fullScreen.autoStart === true) {
                    FullScreen.request($container[0]);
                }

                // Expose API
                instance.FullScreen = FullScreen;

            } else {
                $button.hide();
            }

        },

        'afterKeydown.fb': function(e, instance, current, keypress, keycode) {

            // "P" or Spacebar
            if (instance && instance.FullScreen && keycode === 70) {
                keypress.preventDefault();

                instance.FullScreen.toggle(instance.$refs.container[0]);
            }

        },

        'beforeClose.fb': function(instance) {
            if (instance && instance.FullScreen) {
                FullScreen.exit();
            }
        }
    });

    $(document).on(fn.fullscreenchange, function() {
        var instance = $.fancybox.getInstance();

        // If image is zooming, then force to stop and reposition properly
        if (instance.current && instance.current.type === 'image' && instance.isAnimating) {
            instance.current.$content.css('transition', 'none');

            instance.isAnimating = false;

            instance.update(true, true, 0);
        }

        instance.trigger('onFullscreenChange', FullScreen.isFullscreen());

    });

}(document, window.jQuery));

// ==========================================================================
//
// Thumbs
// Displays thumbnails in a grid
//
// ==========================================================================
;
(function(document, $) {
    'use strict';

    var FancyThumbs = function(instance) {
        this.instance = instance;
        this.init();
    };

    $.extend(FancyThumbs.prototype, {

        $button: null,
        $grid: null,
        $list: null,
        isVisible: false,

        init: function() {
            var self = this;

            var first = self.instance.group[0],
                second = self.instance.group[1];

            self.$button = self.instance.$refs.toolbar.find('[data-fancybox-thumbs]');

            if (self.instance.group.length > 1 && self.instance.group[self.instance.currIndex].opts.thumbs && (
                    (first.type == 'image' || first.opts.thumb || first.opts.$thumb) &&
                    (second.type == 'image' || second.opts.thumb || second.opts.$thumb)
                )) {

                self.$button.on('click', function() {
                    self.toggle();
                });

                self.isActive = true;

            } else {
                self.$button.hide();

                self.isActive = false;
            }

        },

        create: function() {
            var instance = this.instance,
                list,
                src;

            this.$grid = $('<div class="fancybox-thumbs"></div>').appendTo(instance.$refs.container);

            list = '<ul>';

            $.each(instance.group, function(i, item) {

                src = item.opts.thumb || (item.opts.$thumb ? item.opts.$thumb.attr('src') : null);

                if (!src && item.type === 'image') {
                    src = item.src;
                }

                if (src && src.length) {
                    list += '<li data-index="' + i + '"  tabindex="0" class="fancybox-thumbs-loading"><img data-src="' + src + '" /></li>';
                }

            });

            list += '</ul>';

            this.$list = $(list).appendTo(this.$grid).on('click', 'li', function() {
                instance.jumpTo($(this).data('index'));
            });

            this.$list.find('img').hide().one('load', function() {

                    var $parent = $(this).parent().removeClass('fancybox-thumbs-loading'),
                        thumbWidth = $parent.outerWidth(),
                        thumbHeight = $parent.outerHeight(),
                        width,
                        height,
                        widthRatio,
                        heightRatio;

                    width = this.naturalWidth || this.width;
                    height = this.naturalHeight || this.height;

                    // Calculate thumbnail width/height and center it

                    widthRatio = width / thumbWidth;
                    heightRatio = height / thumbHeight;

                    if (widthRatio >= 1 && heightRatio >= 1) {
                        if (widthRatio > heightRatio) {
                            width = width / heightRatio;
                            height = thumbHeight;

                        } else {
                            width = thumbWidth;
                            height = height / widthRatio;
                        }
                    }

                    $(this).css({
                        width: Math.floor(width),
                        height: Math.floor(height),
                        'margin-top': Math.min(0, Math.floor(thumbHeight * 0.3 - height * 0.3)),
                        'margin-left': Math.min(0, Math.floor(thumbWidth * 0.5 - width * 0.5))
                    }).show();

                })
                .each(function() {
                    this.src = $(this).data('src');
                });

        },

        focus: function() {

            if (this.instance.current) {
                this.$list
                    .children()
                    .removeClass('fancybox-thumbs-active')
                    .filter('[data-index="' + this.instance.current.index + '"]')
                    .addClass('fancybox-thumbs-active')
                    .focus();
            }

        },

        close: function() {
            this.$grid.hide();
        },

        update: function() {

            this.instance.$refs.container.toggleClass('fancybox-show-thumbs', this.isVisible);

            if (this.isVisible) {

                if (!this.$grid) {
                    this.create();
                }

                this.instance.trigger('onThumbsShow');

                this.focus();

            } else if (this.$grid) {
                this.instance.trigger('onThumbsHide');
            }

            // Update content position
            this.instance.update();

        },

        hide: function() {
            this.isVisible = false;
            this.update();
        },

        show: function() {
            this.isVisible = true;
            this.update();
        },

        toggle: function() {
            this.isVisible = !this.isVisible;
            this.update();
        }

    });

    $(document).on({

        'onInit.fb': function(e, instance) {
            if (instance && !instance.Thumbs) {
                instance.Thumbs = new FancyThumbs(instance);
            }
        },

        'beforeShow.fb': function(e, instance, item, firstRun) {
            var Thumbs = instance && instance.Thumbs;

            if (!Thumbs || !Thumbs.isActive) {
                return;
            }

            if (item.modal) {
                Thumbs.$button.hide();

                Thumbs.hide();

                return;
            }

            if (firstRun && item.opts.thumbs.autoStart === true) {
                Thumbs.show();
            }

            if (Thumbs.isVisible) {
                Thumbs.focus();
            }
        },

        'afterKeydown.fb': function(e, instance, current, keypress, keycode) {
            var Thumbs = instance && instance.Thumbs;

            // "G"
            if (Thumbs && Thumbs.isActive && keycode === 71) {
                keypress.preventDefault();

                Thumbs.toggle();
            }
        },

        'beforeClose.fb': function(e, instance) {
            var Thumbs = instance && instance.Thumbs;

            if (Thumbs && Thumbs.isVisible && instance.opts.thumbs.hideOnClose !== false) {
                Thumbs.close();
            }
        }

    });

}(document, window.jQuery));

// ==========================================================================
//
// Hash
// Enables linking to each modal
//
// ==========================================================================
;
(function(document, window, $) {
    'use strict';

    // Simple $.escapeSelector polyfill (for jQuery prior v3)
    if (!$.escapeSelector) {
        $.escapeSelector = function(sel) {
            var rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;
            var fcssescape = function(ch, asCodePoint) {
                if (asCodePoint) {
                    // U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
                    if (ch === "\0") {
                        return "\uFFFD";
                    }

                    // Control characters and (dependent upon position) numbers get escaped as code points
                    return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
                }

                // Other potentially-special ASCII characters get backslash-escaped
                return "\\" + ch;
            };

            return (sel + "").replace(rcssescape, fcssescape);
        };
    }

    // Create new history entry only once
    var shouldCreateHistory = true;

    // Variable containing last hash value set by fancyBox
    // It will be used to determine if fancyBox needs to close after hash change is detected
    var currentHash = null;

    // Throttling the history change
    var timerID = null;

    // Get info about gallery name and current index from url
    function parseUrl() {
        var hash = window.location.hash.substr(1);
        var rez = hash.split('-');
        var index = rez.length > 1 && /^\+?\d+$/.test(rez[rez.length - 1]) ? parseInt(rez.pop(-1), 10) || 1 : 1;
        var gallery = rez.join('-');

        // Index is starting from 1
        if (index < 1) {
            index = 1;
        }

        return {
            hash: hash,
            index: index,
            gallery: gallery
        };
    }

    // Trigger click evnt on links to open new fancyBox instance
    function triggerFromUrl(url) {
        var $el;

        if (url.gallery !== '') {

            // If we can find element matching 'data-fancybox' atribute, then trigger click event for that ..
            $el = $("[data-fancybox='" + $.escapeSelector(url.gallery) + "']").eq(url.index - 1);

            if (!$el.length) {
                // .. if not, try finding element by ID
                $el = $("#" + $.escapeSelector(url.gallery) + "");
            }

            if ($el.length) {
                shouldCreateHistory = false;

                $el.trigger('click');
            }

        }
    }

    // Get gallery name from current instance
    function getGalleryID(instance) {
        var opts;

        if (!instance) {
            return false;
        }

        opts = instance.current ? instance.current.opts : instance.opts;

        return opts.hash || (opts.$orig ? opts.$orig.data('fancybox') : '');
    }

    // Star when DOM becomes ready
    $(function() {

        // Small delay is used to allow other scripts to process "dom ready" event
        setTimeout(function() {

            // Check if this module is not disabled
            if ($.fancybox.defaults.hash === false) {
                return;
            }

            // Update hash when opening/closing fancyBox
            $(document).on({
                'onInit.fb': function(e, instance) {
                    var url, gallery;

                    if (instance.group[instance.currIndex].opts.hash === false) {
                        return;
                    }

                    url = parseUrl();
                    gallery = getGalleryID(instance);

                    // Make sure gallery start index matches index from hash
                    if (gallery && url.gallery && gallery == url.gallery) {
                        instance.currIndex = url.index - 1;
                    }

                },

                'beforeShow.fb': function(e, instance, current) {
                    var gallery;

                    if (!current || current.opts.hash === false) {
                        return;
                    }

                    gallery = getGalleryID(instance);

                    // Update window hash
                    if (gallery && gallery !== '') {

                        if (window.location.hash.indexOf(gallery) < 0) {
                            instance.opts.origHash = window.location.hash;
                        }

                        currentHash = gallery + (instance.group.length > 1 ? '-' + (current.index + 1) : '');

                        if ('replaceState' in window.history) {
                            if (timerID) {
                                clearTimeout(timerID);
                            }

                            timerID = setTimeout(function() {
                                window.history[shouldCreateHistory ? 'pushState' : 'replaceState']({}, document.title, window.location.pathname + window.location.search + '#' + currentHash);

                                timerID = null;

                                shouldCreateHistory = false;

                            }, 300);

                        } else {
                            window.location.hash = currentHash;
                        }

                    }

                },

                'beforeClose.fb': function(e, instance, current) {
                    var gallery, origHash;

                    if (timerID) {
                        clearTimeout(timerID);
                    }

                    if (current.opts.hash === false) {
                        return;
                    }

                    gallery = getGalleryID(instance);
                    origHash = instance && instance.opts.origHash ? instance.opts.origHash : '';

                    // Remove hash from location bar
                    if (gallery && gallery !== '') {

                        if ('replaceState' in history) {
                            window.history.replaceState({}, document.title, window.location.pathname + window.location.search + origHash);

                        } else {
                            window.location.hash = origHash;

                            // Keep original scroll position
                            $(window).scrollTop(instance.scrollTop).scrollLeft(instance.scrollLeft);
                        }
                    }

                    currentHash = null;
                }
            });

            // Check if need to close after url has changed
            $(window).on('hashchange.fb', function() {
                var url = parseUrl();

                if ($.fancybox.getInstance()) {
                    if (currentHash && currentHash !== url.gallery + '-' + url.index && !(url.index === 1 && currentHash == url.gallery)) {
                        currentHash = null;

                        $.fancybox.close();
                    }

                } else if (url.gallery !== '') {
                    triggerFromUrl(url);
                }
            });

            // Check current hash and trigger click event on matching element to start fancyBox, if needed
            triggerFromUrl(parseUrl());

        }, 50);

    });

}(document, window, window.jQuery));


! function(e) {
    function t(s) { if (i[s]) return i[s].exports; var a = i[s] = { i: s, l: !1, exports: {} }; return e[s].call(a.exports, a, a.exports, t), a.l = !0, a.exports }
    var i = {};
    t.m = e, t.c = i, t.d = function(e, i, s) { t.o(e, i) || Object.defineProperty(e, i, { configurable: !1, enumerable: !0, get: s }) }, t.n = function(e) { var i = e && e.__esModule ? function() { return e.default } : function() { return e }; return t.d(i, "a", i), i }, t.o = function(e, t) { return Object.prototype.hasOwnProperty.call(e, t) }, t.p = "", t(t.s = 0)
}([function(e, t, i) { i(1), e.exports = i(6) }, function(e, t, i) {
    "use strict";

    function s(e) { return e && e.__esModule ? e : { default: e } }

    function a(e, t) { if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function") } Object.defineProperty(t, "__esModule", { value: !0 });
    var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) { return typeof e } : function(e) { return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e },
        l = function() {
            function e(e, t) {
                for (var i = 0; i < t.length; i++) {
                    var s = t[i];
                    s.enumerable = s.enumerable || !1, s.configurable = !0, "value" in s && (s.writable = !0), Object.defineProperty(e, s.key, s)
                }
            }
            return function(t, i, s) { return i && e(t.prototype, i), s && e(t, s), t }
        }(),
        o = i(2),
        d = s(o),
        r = i(3),
        c = s(r),
        h = i(4),
        u = s(h),
        f = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        p = window.parent !== window.self,
        b = void 0,
        m = function() {
            function e(t, i) {
                a(this, e), this.sel = t;
                var s = void 0,
                    n = void 0,
                    l = window.Dropkick;
                for ("string" == typeof this.sel && "#" === this.sel[0] && (this.sel = document.getElementById(t.substr(1))), s = 0; s < l.uid; s++)
                    if ((n = l.cache[s]) instanceof e && n.data.select === this.sel) return d.default.extend(n.data.settings, i), n;
                if (!this.sel) throw "You must pass a select to DropKick";
                if (this.sel.length < 1) throw "You must have options inside your <select>: " + t;
                if ("SELECT" === this.sel.nodeName) return this.init(this.sel, i)
            }
            return l(e, [{
                key: "init",
                value: function(t, i) {
                    var s, a = window.Dropkick,
                        n = e.build(t, "dk" + a.uid);
                    if (this.data = {}, this.data.select = t, this.data.elem = n.elem, this.data.settings = d.default.extend({}, c.default, i), this.disabled = t.disabled, this.form = t.form, this.length = t.length, this.multiple = t.multiple, this.options = n.options.slice(0), this.selectedIndex = t.selectedIndex, this.selectedOptions = n.selected.slice(0), this.value = t.value, this.data.cacheID = a.uid, a.cache[this.data.cacheID] = this, this.data.settings.initialize.call(this), a.uid += 1, this._changeListener || (t.addEventListener("change", this), this._changeListener = !0), !f || this.data.settings.mobile) {
                        if (t.parentNode.insertBefore(this.data.elem, t), t.setAttribute("data-dkCacheId", this.data.cacheID), this.data.elem.addEventListener("click", this), this.data.elem.addEventListener("keydown", this), this.data.elem.addEventListener("keypress", this), this.form && this.form.addEventListener("reset", this), !this.multiple)
                            for (s = 0; s < this.options.length; s++) this.options[s].addEventListener("mouseover", this);
                        b || (document.addEventListener("click", e.onDocClick), p && parent.document.addEventListener("click", e.onDocClick), b = !0)
                    }
                    return this
                }
            }, { key: "add", value: function(e, t) { var i, s, a; "string" == typeof e && (i = e, e = document.createElement("option"), e.text = i), "OPTION" === e.nodeName && (s = d.default.create("li", { class: "dk-option", "data-value": e.value, text: e.text, innerHTML: e.innerHTML, role: "option", "aria-selected": "false", id: "dk" + this.data.cacheID + "-" + (e.id || e.value.replace(" ", "-")) }), d.default.addClass(s, e.className), this.length += 1, e.disabled && (d.default.addClass(s, "dk-option-disabled"), s.setAttribute("aria-disabled", "true")), e.hidden && (d.default.addClass(s, "dk-option-hidden"), s.setAttribute("aria-hidden", "true")), this.data.select.add(e, t), "number" == typeof t && (t = this.item(t)), a = this.options.indexOf(t), a > -1 ? (t.parentNode.insertBefore(s, t), this.options.splice(a, 0, s)) : (this.data.elem.lastChild.appendChild(s), this.options.push(s)), s.addEventListener("mouseover", this), e.selected && this.select(a)) } }, { key: "item", value: function(e) { return e = e < 0 ? this.options.length + e : e, this.options[e] || null } }, {
                key: "remove",
                value: function(e) {
                    var t = this.item(e);
                    t.parentNode.removeChild(t), this.options.splice(e, 1), this.data.select.remove(e), this.select(this.data.select.selectedIndex), this.length -= 1
                }
            }, {
                key: "close",
                value: function() {
                    var e, t = this.data.elem;
                    if (!this.isOpen || this.multiple) return !1;
                    for (e = 0; e < this.options.length; e++) d.default.removeClass(this.options[e], "dk-option-highlight");
                    t.lastChild.setAttribute("aria-expanded", "false"), d.default.removeClass(t.lastChild, "dk-select-options-highlight"), d.default.removeClass(t, "dk-select-open-(up|down)"), this.isOpen = !1, this.data.settings.close.call(this)
                }
            }, {
                key: "open",
                value: function() {
                    var e = void 0,
                        t = void 0,
                        i = void 0,
                        s = void 0,
                        a = void 0,
                        n = void 0,
                        l = this.data.elem,
                        o = l.lastChild,
                        r = void 0 !== window.pageXOffset,
                        c = "CSS1Compat" === (document.compatMode || ""),
                        h = r ? window.pageYOffset : c ? document.documentElement.scrollTop : document.body.scrollTop;
                    if (a = d.default.offset(l).top - h, n = window.innerHeight - (a + l.offsetHeight), this.isOpen || this.multiple) return !1;
                    o.style.display = "block", e = o.offsetHeight, o.style.display = "", t = a > e, i = n > e, s = t && !i ? "-up" : "-down", this.isOpen = !0, d.default.addClass(l, "dk-select-open" + s), o.setAttribute("aria-expanded", "true"), this._scrollTo(this.options.length - 1), this._scrollTo(this.selectedIndex), this.data.settings.open.call(this)
                }
            }, {
                key: "disable",
                value: function(e, t) {
                    var i = "dk-option-disabled";
                    0 !== arguments.length && "boolean" != typeof e || (t = void 0 === e, e = this.data.elem, i = "dk-select-disabled", this.disabled = t), void 0 === t && (t = !0), "number" == typeof e && (e = this.item(e)), t ? (e.setAttribute("aria-disabled", !0), d.default.addClass(e, i)) : (e.setAttribute("aria-disabled", !1), d.default.removeClass(e, i))
                }
            }, { key: "hide", value: function(e, t) { void 0 === t && (t = !0), e = this.item(e), t ? (e.setAttribute("aria-hidden", !0), d.default.addClass(e, "dk-option-hidden")) : (e.setAttribute("aria-hidden", !1), d.default.removeClass(e, "dk-option-hidden")) } }, {
                key: "select",
                value: function(e, t) {
                    var i, s, a, n, l = this.data.select;
                    if ("number" == typeof e && (e = this.item(e)), "string" == typeof e)
                        for (i = 0; i < this.length; i++) this.options[i].getAttribute("data-value") === e && (e = this.options[i]);
                    return !(!e || "string" == typeof e || !t && d.default.hasClass(e, "dk-option-disabled")) && (d.default.hasClass(e, "dk-option") ? (s = this.options.indexOf(e), a = l.options[s], this.multiple ? (d.default.toggleClass(e, "dk-option-selected"), a.selected = !a.selected, d.default.hasClass(e, "dk-option-selected") ? (e.setAttribute("aria-selected", "true"), this.selectedOptions.push(e)) : (e.setAttribute("aria-selected", "false"), s = this.selectedOptions.indexOf(e), this.selectedOptions.splice(s, 1))) : (n = this.data.elem.firstChild, this.selectedOptions.length && (d.default.removeClass(this.selectedOptions[0], "dk-option-selected"), this.selectedOptions[0].setAttribute("aria-selected", "false")), d.default.addClass(e, "dk-option-selected"), e.setAttribute("aria-selected", "true"), n.setAttribute("aria-activedescendant", e.id), n.className = "dk-selected " + a.className, n.innerHTML = a.innerHTML, this.selectedOptions[0] = e, a.selected = !0), this.selectedIndex = l.selectedIndex, this.value = l.value, t || this.data.select.dispatchEvent(new u.default("change", { bubbles: this.data.settings.bubble })), e) : void 0)
                }
            }, { key: "selectOne", value: function(e, t) { return this.reset(!0), this._scrollTo(e), this.select(e, t) } }, {
                key: "search",
                value: function(e, t) {
                    var i, s, a, n, l, o, d, r, c = this.data.select.options,
                        h = [];
                    if (!e) return this.options;
                    for (t = t ? t.toLowerCase() : "strict", t = "fuzzy" === t ? 2 : "partial" === t ? 1 : 0, r = new RegExp((t ? "" : "^") + e, "i"), i = 0; i < c.length; i++)
                        if (a = c[i].text.toLowerCase(), 2 == t) {
                            for (s = e.toLowerCase().split(""), n = l = o = d = 0; l < a.length;) a[l] === s[n] ? (o += 1 + o, n++) : o = 0, d += o, l++;
                            n === s.length && h.push({ e: this.options[i], s: d, i: i })
                        } else r.test(a) && h.push(this.options[i]);
                    return 2 === t && (h = h.sort(function(e, t) { return t.s - e.s || e.i - t.i }).reduce(function(e, t) { return e[e.length] = t.e, e }, [])), h
                }
            }, { key: "focus", value: function() { this.disabled || (this.multiple ? this.data.elem : this.data.elem.children[0]).focus() } }, {
                key: "reset",
                value: function(e) {
                    var t, i = this.data.select;
                    for (this.selectedOptions.length = 0, t = 0; t < i.options.length; t++) i.options[t].selected = !1, d.default.removeClass(this.options[t], "dk-option-selected"), this.options[t].setAttribute("aria-selected", "false"), !e && i.options[t].defaultSelected && this.select(t, !0);
                    this.selectedOptions.length || this.multiple || this.select(0, !0)
                }
            }, { key: "refresh", value: function() { Object.keys(this).length > 0 && (!f || this.data.settings.mobile) && this.dispose().init(this.data.select, this.data.settings) } }, { key: "dispose", value: function() { var e = window.Dropkick; return Object.keys(this).length > 0 && (!f || this.data.settings.mobile) && (delete e.cache[this.data.cacheID], this.data.elem.parentNode.removeChild(this.data.elem), this.data.select.removeAttribute("data-dkCacheId")), this } }, {
                key: "handleEvent",
                value: function(e) {
                    if (!this.disabled) switch (e.type) {
                        case "click":
                            this._delegate(e);
                            break;
                        case "keydown":
                            this._keyHandler(e);
                            break;
                        case "keypress":
                            this._searchOptions(e);
                            break;
                        case "mouseover":
                            this._highlight(e);
                            break;
                        case "reset":
                            this.reset();
                            break;
                        case "change":
                            this.data.settings.change.call(this)
                    }
                }
            }, {
                key: "_delegate",
                value: function(e) {
                    var t, i, s, a, n = e.target;
                    if (d.default.hasClass(n, "dk-option-disabled")) return !1;
                    if (this.multiple) {
                        if (d.default.hasClass(n, "dk-option"))
                            if (t = window.getSelection(), "Range" === t.type && t.collapseToStart(), e.shiftKey)
                                if (s = this.options.indexOf(this.selectedOptions[0]), a = this.options.indexOf(this.selectedOptions[this.selectedOptions.length - 1]), i = this.options.indexOf(n), i > s && i < a && (i = s), i > a && a > s && (a = s), this.reset(!0), a > i)
                                    for (; i < a + 1;) this.select(i++);
                                else
                                    for (; i > a - 1;) this.select(i--);
                        else e.ctrlKey || e.metaKey ? this.select(n) : (this.reset(!0), this.select(n))
                    } else this[this.isOpen ? "close" : "open"](), d.default.hasClass(n, "dk-option") && this.select(n)
                }
            }, {
                key: "_highlight",
                value: function(e) {
                    var t, i = e.target;
                    if (!this.multiple) {
                        for (t = 0; t < this.options.length; t++) d.default.removeClass(this.options[t], "dk-option-highlight");
                        d.default.addClass(this.data.elem.lastChild, "dk-select-options-highlight"), d.default.addClass(i, "dk-option-highlight")
                    }
                }
            }, {
                key: "_keyHandler",
                value: function(e) {
                    var t, i, s = this.selectedOptions,
                        a = this.options,
                        n = 1,
                        l = { tab: 9, enter: 13, esc: 27, space: 32, up: 38, down: 40 };
                    switch (e.keyCode) {
                        case l.up:
                            n = -1;
                        case l.down:
                            if (e.preventDefault(), t = s[s.length - 1], d.default.hasClass(this.data.elem.lastChild, "dk-select-options-highlight"))
                                for (d.default.removeClass(this.data.elem.lastChild, "dk-select-options-highlight"), i = 0; i < a.length; i++) d.default.hasClass(a[i], "dk-option-highlight") && (d.default.removeClass(a[i], "dk-option-highlight"), t = a[i]);
                            n = a.indexOf(t) + n, n > a.length - 1 ? n = a.length - 1 : n < 0 && (n = 0), this.data.select.options[n].disabled || (this.reset(!0), this.select(n), this._scrollTo(n));
                            break;
                        case l.space:
                            if (!this.isOpen) { e.preventDefault(), this.open(); break }
                        case l.tab:
                        case l.enter:
                            for (n = 0; n < a.length; n++) d.default.hasClass(a[n], "dk-option-highlight") && this.select(n);
                        case l.esc:
                            this.isOpen && (e.preventDefault(), this.close())
                    }
                }
            }, {
                key: "_searchOptions",
                value: function(e) {
                    var t, i = this,
                        s = String.fromCharCode(e.keyCode || e.which);
                    void 0 === this.data.searchString && (this.data.searchString = ""),
                        function() { i.data.searchTimeout && clearTimeout(i.data.searchTimeout), i.data.searchTimeout = setTimeout(function() { i.data.searchString = "" }, 1e3) }(), this.data.searchString += s, t = this.search(this.data.searchString, this.data.settings.search), t.length && (d.default.hasClass(t[0], "dk-option-disabled") || this.selectOne(t[0]))
                }
            }, { key: "_scrollTo", value: function(e) { var t, i, s, a = this.data.elem.lastChild; if (-1 === e || "number" != typeof e && !e || !this.isOpen && !this.multiple) return !1; "number" == typeof e && (e = this.item(e)), t = d.default.position(e, a).top, i = t - a.scrollTop, s = i + e.offsetHeight, s > a.offsetHeight ? (t += e.offsetHeight, a.scrollTop = t - a.offsetHeight) : i < 0 && (a.scrollTop = t) } }]), e
        }();
    t.default = m, window.Dropkick = m, window.Dropkick.cache = {}, window.Dropkick.uid = 0, m.build = function(e, t) {
        var i, s, a, n = [],
            l = { elem: null, options: [], selected: [] },
            o = function e(i) {
                var s, a, n, o, r = [];
                switch (i.nodeName) {
                    case "OPTION":
                        s = d.default.create("li", { class: "dk-option ", "data-value": i.value, text: i.text, innerHTML: i.innerHTML, role: "option", "aria-selected": "false", id: t + "-" + (i.id || i.value.replace(" ", "-")) }), d.default.addClass(s, i.className), i.disabled && (d.default.addClass(s, "dk-option-disabled"), s.setAttribute("aria-disabled", "true")), i.hidden && (d.default.addClass(s, "dk-option-hidden"), s.setAttribute("aria-hidden", "true")), i.selected && (d.default.addClass(s, "dk-option-selected"), s.setAttribute("aria-selected", "true"), l.selected.push(s)), l.options.push(this.appendChild(s));
                        break;
                    case "OPTGROUP":
                        for (a = d.default.create("li", { class: "dk-optgroup" }), i.label && a.appendChild(d.default.create("div", { class: "dk-optgroup-label", innerHTML: i.label })), n = d.default.create("ul", { class: "dk-optgroup-options" }), o = i.children.length; o--; r.unshift(i.children[o]));
                        i.disabled && (a.classList.add("dk-optgroup-disabled"), r.forEach(function(e) { e.disabled = i.disabled })), r.forEach(e, n), this.appendChild(a).appendChild(n)
                }
            };
        for (l.elem = d.default.create("div", { class: "dk-select" + (e.multiple ? "-multi" : "") }), s = d.default.create("ul", { class: "dk-select-options", id: t + "-listbox", role: "listbox" }), e.disabled && (d.default.addClass(l.elem, "dk-select-disabled"), l.elem.setAttribute("aria-disabled", !0)), l.elem.id = t + (e.id ? "-" + e.id : ""), d.default.addClass(l.elem, e.className), e.multiple ? (l.elem.setAttribute("tabindex", e.getAttribute("tabindex") || "0"), s.setAttribute("aria-multiselectable", "true")) : (i = e.options[e.selectedIndex], l.elem.appendChild(d.default.create("div", { class: "dk-selected " + (i ? i.className : ""), tabindex: e.tabindex || 0, innerHTML: i ? i.text : "&nbsp;", id: t + "-combobox", "aria-live": "assertive", "aria-owns": s.id, role: "combobox" })), s.setAttribute("aria-expanded", "false")), a = e.children.length; a--; n.unshift(e.children[a]));
        return n.forEach(o, l.elem.appendChild(s)), l
    }, m.onDocClick = function(e) {
        var t, i, s = window.Dropkick;
        if (1 !== e.target.nodeType) return !1;
        null !== (t = e.target.getAttribute("data-dkcacheid")) && s.cache[t].focus();
        for (i in s.cache) d.default.closest(e.target, s.cache[i].data.elem) || i === t || s.cache[i].disabled || s.cache[i].close()
    }, void 0 !== window.jQuery && (window.jQuery.fn.dropkick = function() { var e = Array.prototype.slice.call(arguments); return jQuery(this).each(function() { e[0] && "object" !== n(e[0]) ? "string" == typeof e[0] && m.prototype[e[0]].apply(new m(this), e.slice(1)) : new m(this, e[0] || {}) }) })
}, function(e, t, i) {
    "use strict";
    Object.defineProperty(t, "__esModule", { value: !0 });
    var s = -1 !== navigator.appVersion.indexOf("MSIE"),
        a = {
            hasClass: function(e, t) { var i = new RegExp("(^|\\s+)" + t + "(\\s+|$)"); return e && i.test(e.className) },
            addClass: function(e, t) { e && !this.hasClass(e, t) && (e.className += " " + t) },
            removeClass: function(e, t) {
                var i = new RegExp("(^|\\s+)" + t + "(\\s+|$)");
                e && (e.className = e.className.replace(i, " "))
            },
            toggleClass: function(e, t) {
                [(this.hasClass(e, t) ? "remove" : "add") + "Class"](e, t)
            },
            extend: function(e) {
                return Array.prototype.slice.call(arguments, 1).forEach(function(t) {
                    if (t)
                        for (var i in t) e[i] = t[i]
                }), e
            },
            offset: function(e) {
                var t = e.getBoundingClientRect() || { top: 0, left: 0 },
                    i = document.documentElement,
                    a = s ? i.scrollTop : window.pageYOffset,
                    n = s ? i.scrollLeft : window.pageXOffset;
                return { top: t.top + a - i.clientTop, left: t.left + n - i.clientLeft }
            },
            position: function(e, t) { for (var i = { top: 0, left: 0 }; e && e !== t;) i.top += e.offsetTop, i.left += e.offsetLeft, e = e.parentNode; return i },
            closest: function(e, t) {
                for (; e;) {
                    if (e === t) return e;
                    e = e.parentNode
                }
                return !1
            },
            create: function(e, t) {
                var i = void 0,
                    s = document.createElement(e);
                t || (t = {});
                for (i in t) t.hasOwnProperty(i) && ("innerHTML" === i ? s.innerHTML = t[i] : s.setAttribute(i, t[i]));
                return s
            },
            deferred: function(e) {
                return function() {
                    var t = this,
                        i = arguments;
                    window.setTimeout(function() { e.apply(t, i) }, 1)
                }
            }
        };
    t.default = a
}, function(e, t, i) {
    "use strict";
    Object.defineProperty(t, "__esModule", { value: !0 });
    var s = { initialize: function() {}, mobile: !0, change: function() {}, open: function() {}, close: function() {}, search: "strict", bubble: !0 };
    t.default = s
}, function(e, t, i) {
    (function(t) {
        var i = t.CustomEvent;
        e.exports = function() { try { var e = new i("cat", { detail: { foo: "bar" } }); return "cat" === e.type && "bar" === e.detail.foo } catch (e) {} return !1 }() ? i : "undefined" != typeof document && "function" == typeof document.createEvent ? function(e, t) { var i = document.createEvent("CustomEvent"); return t ? i.initCustomEvent(e, t.bubbles, t.cancelable, t.detail) : i.initCustomEvent(e, !1, !1, void 0), i } : function(e, t) { var i = document.createEventObject(); return i.type = e, t ? (i.bubbles = Boolean(t.bubbles), i.cancelable = Boolean(t.cancelable), i.detail = t.detail) : (i.bubbles = !1, i.cancelable = !1, i.detail = void 0), i }
    }).call(t, i(5))
}, function(e, t) {
    var i;
    i = function() { return this }();
    try { i = i || Function("return this")() || (0, eval)("this") } catch (e) { "object" == typeof window && (i = window) } e.exports = i
}, function(e, t) {}]);

/*
    jQuery Masked Input Plugin
    Copyright (c) 2007 - 2015 Josh Bush (digitalbush.com)
    Licensed under the MIT license (http://digitalbush.com/projects/masked-input-plugin/#license)
    Version: 1.4.1
*/
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):a("object"==typeof exports?require("jquery"):jQuery)}(function(a){var b,c=navigator.userAgent,d=/iphone/i.test(c),e=/chrome/i.test(c),f=/android/i.test(c);a.mask={definitions:{9:"[0-9]",a:"[A-Za-z]","*":"[A-Za-z0-9]"},autoclear:!0,dataName:"rawMaskFn",placeholder:"_"},a.fn.extend({caret:function(a,b){var c;if(0!==this.length&&!this.is(":hidden"))return"number"==typeof a?(b="number"==typeof b?b:a,this.each(function(){this.setSelectionRange?this.setSelectionRange(a,b):this.createTextRange&&(c=this.createTextRange(),c.collapse(!0),c.moveEnd("character",b),c.moveStart("character",a),c.select())})):(this[0].setSelectionRange?(a=this[0].selectionStart,b=this[0].selectionEnd):document.selection&&document.selection.createRange&&(c=document.selection.createRange(),a=0-c.duplicate().moveStart("character",-1e5),b=a+c.text.length),{begin:a,end:b})},unmask:function(){return this.trigger("unmask")},mask:function(c,g){var h,i,j,k,l,m,n,o;if(!c&&this.length>0){h=a(this[0]);var p=h.data(a.mask.dataName);return p?p():void 0}return g=a.extend({autoclear:a.mask.autoclear,placeholder:a.mask.placeholder,completed:null},g),i=a.mask.definitions,j=[],k=n=c.length,l=null,a.each(c.split(""),function(a,b){"?"==b?(n--,k=a):i[b]?(j.push(new RegExp(i[b])),null===l&&(l=j.length-1),k>a&&(m=j.length-1)):j.push(null)}),this.trigger("unmask").each(function(){function h(){if(g.completed){for(var a=l;m>=a;a++)if(j[a]&&C[a]===p(a))return;g.completed.call(B)}}function p(a){return g.placeholder.charAt(a<g.placeholder.length?a:0)}function q(a){for(;++a<n&&!j[a];);return a}function r(a){for(;--a>=0&&!j[a];);return a}function s(a,b){var c,d;if(!(0>a)){for(c=a,d=q(b);n>c;c++)if(j[c]){if(!(n>d&&j[c].test(C[d])))break;C[c]=C[d],C[d]=p(d),d=q(d)}z(),B.caret(Math.max(l,a))}}function t(a){var b,c,d,e;for(b=a,c=p(a);n>b;b++)if(j[b]){if(d=q(b),e=C[b],C[b]=c,!(n>d&&j[d].test(e)))break;c=e}}function u(){var a=B.val(),b=B.caret();if(o&&o.length&&o.length>a.length){for(A(!0);b.begin>0&&!j[b.begin-1];)b.begin--;if(0===b.begin)for(;b.begin<l&&!j[b.begin];)b.begin++;B.caret(b.begin,b.begin)}else{for(A(!0);b.begin<n&&!j[b.begin];)b.begin++;B.caret(b.begin,b.begin)}h()}function v(){A(),B.val()!=E&&B.change()}function w(a){if(!B.prop("readonly")){var b,c,e,f=a.which||a.keyCode;o=B.val(),8===f||46===f||d&&127===f?(b=B.caret(),c=b.begin,e=b.end,e-c===0&&(c=46!==f?r(c):e=q(c-1),e=46===f?q(e):e),y(c,e),s(c,e-1),a.preventDefault()):13===f?v.call(this,a):27===f&&(B.val(E),B.caret(0,A()),a.preventDefault())}}function x(b){if(!B.prop("readonly")){var c,d,e,g=b.which||b.keyCode,i=B.caret();if(!(b.ctrlKey||b.altKey||b.metaKey||32>g)&&g&&13!==g){if(i.end-i.begin!==0&&(y(i.begin,i.end),s(i.begin,i.end-1)),c=q(i.begin-1),n>c&&(d=String.fromCharCode(g),j[c].test(d))){if(t(c),C[c]=d,z(),e=q(c),f){var k=function(){a.proxy(a.fn.caret,B,e)()};setTimeout(k,0)}else B.caret(e);i.begin<=m&&h()}b.preventDefault()}}}function y(a,b){var c;for(c=a;b>c&&n>c;c++)j[c]&&(C[c]=p(c))}function z(){B.val(C.join(""))}function A(a){var b,c,d,e=B.val(),f=-1;for(b=0,d=0;n>b;b++)if(j[b]){for(C[b]=p(b);d++<e.length;)if(c=e.charAt(d-1),j[b].test(c)){C[b]=c,f=b;break}if(d>e.length){y(b+1,n);break}}else C[b]===e.charAt(d)&&d++,k>b&&(f=b);return a?z():k>f+1?g.autoclear||C.join("")===D?(B.val()&&B.val(""),y(0,n)):z():(z(),B.val(B.val().substring(0,f+1))),k?b:l}var B=a(this),C=a.map(c.split(""),function(a,b){return"?"!=a?i[a]?p(b):a:void 0}),D=C.join(""),E=B.val();B.data(a.mask.dataName,function(){return a.map(C,function(a,b){return j[b]&&a!=p(b)?a:null}).join("")}),B.one("unmask",function(){B.off(".mask").removeData(a.mask.dataName)}).on("focus.mask",function(){if(!B.prop("readonly")){clearTimeout(b);var a;E=B.val(),a=A(),b=setTimeout(function(){B.get(0)===document.activeElement&&(z(),a==c.replace("?","").length?B.caret(0,a):B.caret(a))},10)}}).on("blur.mask",v).on("keydown.mask",w).on("keypress.mask",x).on("input.mask paste.mask",function(){B.prop("readonly")||setTimeout(function(){var a=A(!0);B.caret(a),h()},0)}),e&&f&&B.off("input.mask").on("input.mask",u),A()})}})});



$(document).ready(function() {
    console.log('Ну нельзя просто не написать Hello world!!!');
    $('.intro').slick({
        dots: false,
        infinite: true,
        speed: 500,
        arrows: true,
        fade: true,
        cssEase: 'linear'
    });

    $('.actions-slider').slick({
        infinite: true,
        slidesToShow: 2,
        slidesToScroll: 1,
        arrows: false,
        dots: true,
        responsive: [{
            breakpoint: 768,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }]
    });

    $('input[type="tel"]').mask("+7-999-999-9999");

    $('.services__link').on('click', function() {
        $('.services__link').removeClass('is-active');
        $(this).addClass('is-active');
        var i = $(this).index();
        i += 1;
        $('.services__tab').removeClass('is-active');
        $('.services__tab:nth-child(' + i + ')').addClass('is-active');
        $('.services__footer').show();
    });
    $('.show__article').on('click', function() {
        $(document).find('.services__tab').css('max-height', '107px');
        $(document).find('.services__tab.is-active').css('max-height', 'inherit');
        $('.services__footer').hide();
        return false;
    });
    $('.navbar-toggle').on('click', function() {
        $(this).toggleClass('is-active');
        $('.header-mobile__dropdown').toggleClass('is-active');
        return false;
    });

    $('.expand-block__link').on('click', function() {
        $(this).closest('.expand-block__footer').hide();
        $(this).closest('.expand-block__footer').prev('.container').find('.expand-block').addClass('is-active');
        $(this).closest('.expand-block__footer').prev('.expand-block').addClass('is-active');
        return false;
    });

    var deviceHeight = $(window).height();
    var headerHeight = $('.header-mobile__navigation').height();
    var mobileDropdownHeight = deviceHeight - headerHeight - 40;
    $('.header-mobile__dropdown').css('height', mobileDropdownHeight);

    const ps = new PerfectScrollbar('.header-mobile__dropdown', {
        suppressScrollX: true
    });

    $('.menu__link, .submenu__link').on('click', function() {
        $(this).toggleClass('is-active');
        return false;
    });

    $('.view-link--list').on('click', function() {
        $('.store__body').addClass('is-list');
        $('.view-link').removeClass('is-active');
        $(this).addClass('is-active');
        return false;
    });

    $('.view-link--tiled').on('click', function() {
        $('.store__body').removeClass('is-list');
        $('.view-link').removeClass('is-active');
        $(this).addClass('is-active');
        return false;
    });

    $("select").dropkick({
        mobile: true
    });

    $('.slider').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        fade: true,
        asNavFor: '.carousel'
    });

    $('.carousel').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        asNavFor: '.slider',
        vertical: true,
        centerMode: true,
        verticalSwiping: true,
        arrows: true,
        dots: false,
        focusOnSelect: true,
        responsive: [{
                breakpoint: 500,
                settings: {
                    slidesToShow: 3,
                    vertical: false,
                    verticalSwiping: false,
                    slidesToScroll: 1
                }
            },

            {
                breakpoint: 400,
                settings: {
                    slidesToShow: 2,
                    vertical: false,
                    verticalSwiping: false,
                    slidesToScroll: 1
                }
            }
        ]
    });

    $('.description__link').on('click', function() {
        var index = $(this).index();
        index += 1;
        $('.description__link, .description__item').removeClass('is-active');
        $(this).addClass('is-active');
        $('.description__item:nth-child(' + index + ')').addClass('is-active');
    });

    $('.contacts__tab').on('click', function() {
        var index = $(this).index();
        index += 1;
        console.log(index);
        $('.contacts__tab, .contacts__item, .map__item').removeClass('is-active');
        $(this).addClass('is-active');
        $('.contacts__item:nth-child(' + index + ')').addClass('is-active');
        if (index == 1) {
            $('#map_moscow').addClass('is-active');
        }
        if (index == 2) {
            $('#map_piter').addClass('is-active');
        }
        $('.contacts__metro').removeClass('is-active');
        $('.contacts__metro-footer').show();
    });


    $('.engineer-call__form .btn').on('click', function() {
        var engineer__trs = $('.engineer-call__tbody').find('.engineer-call__tr');
        engineer__trs = engineer__trs.length + 1;
        $('.engineer-call__tbody').append('<tr class="engineer-call__tr"><td class="engineer-call__td" data-title="№"><strong class="engineer-call__num">' + engineer__trs + '.</strong></td><td class="engineer-call__td" data-title="Наименование стоматологического оборудования"><input class="engineer-call__textinput" type="text"></td><td class="engineer-call__td" data-title="№ кабинета"><input class="engineer-call__textinput" type="text"></td><td class="engineer-call__td" data-title="Описание неисправности"><input class="engineer-call__textinput" type="text"></td></tr>')
    });

    $('.contacts__metro-link').on('click', function() {
        $(this).closest('.contacts__metro-footer').prev('.contacts__metro').addClass('is-active');
        $(this).closest('.contacts__metro-footer').hide();
    });

    $('.contacts__moscow').on('click', function() {
        $.fancybox.open({
            src: '#map_moscow2_modal',
            type: 'inline',
            opts: {
                afterShow: function(instance, current) {

                    var mapicon = L.icon({
                        iconUrl: 'images/map-marker.png',
                        iconSize: [54, 68],
                        iconAnchor: [22, 94],
                        popupAnchor: [-3, -100]
                    });
                    var map_moscow2 = L.map('map_moscow2', { scrollWheelZoom: false }).setView([55.9033566, 37.436222], 14);
                    map_moscow2.scrollWheelZoom.disable();
                    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                        attribution: 'Схема проезда'
                    }).addTo(map_moscow2);

                    L.marker([55.9033566, 37.436222], { icon: mapicon }).addTo(map_moscow2)
                        .bindPopup('<img src="images/map-logo.png">')
                        .openPopup();
                }
            }
        });
    });


    $('.contacts__piter').on('click', function() {
        $.fancybox.open({
            src: '#map_piter2_modal',
            type: 'inline',
            opts: {
                afterShow: function(instance, current) {
                    var mapicon = L.icon({
                        iconUrl: 'images/map-marker.png',
                        iconSize: [54, 68],
                        iconAnchor: [22, 94],
                        popupAnchor: [-3, -100]
                    });
                    var map_piter2 = L.map('map_piter2', { scrollWheelZoom: false }).setView([60.0003179,30.2565891], 14);
                    map_piter2.scrollWheelZoom.disable();
                    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                        attribution: 'Схема проезда'
                    }).addTo(map_piter2);

                    L.marker([60.0003179,30.2565891], { icon: mapicon }).addTo(map_piter2)
                        .bindPopup('<img src="images/map-logo.png">')
                        .openPopup();
                }
            }
        });
    });
    $('.fancybox-close-small').on('click', function(){
        $('form').reset();
        alert('!');
    })
});