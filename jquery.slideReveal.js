(function( $ ){

  $.fn.slideReveal = function( options ) {
    
    // build main options before element iteration
    var opts = $.extend({}, $.fn.slideReveal.defaults, options);
    
    return this.each(function() {

      var $this = $(this),
          o = $.meta ? $.extend({}, opts, $this.data()) : opts, // support for the meta data plugin if it's being used build element specific options
          mouseEnter = function(){},
          mouseLeave = function(){},
          transitionEvents = [],
          $title = $this.find('.' + o.titleClass), // set the title element
          $children = $title.children().not(':first-child'), // get all children except the first element
          $img = $this.find('.' + o.bgClass ); 
    
      // hide the children
      $children.hide();      
      //o.children = $children; // store children for later use in animation function
      //o.img = $img;
      
      // initialise boxes, setting anchor and dimentions
      $.fn.slideReveal.setAnchor( $title, o.startingPosition );      
      switch( o.startingPosition ){
        case 'top':
          // need to set the last transition up at the beginning to avoid the random
          // transition from choosening a transition which will just move it to to where
          // it's currently already positioned
          $this.data('slideReveal', { lastTransition : 'slideUp' });
          $title.width( $this.width() );
          $title.height( o.startHeight );
          break;
        case 'bottom':
          $this.data('slideReveal', { lastTransition : 'slideDown' });
          $title.width( $this.width() );
          $title.height( o.startHeight );
          break;
        case 'left':
          $this.data('slideReveal', { lastTransition : 'slideLeft' });
          $title.width( o.startWidth );
          $title.height( $this.height() );
          break;
        case 'right':
          $this.data('slideReveal', { lastTransition : 'slideRight' });
          $title.width( o.startWidth );
          $title.height( $this.height() );
          break;
      }
      
      // set the trasnitions up for mouseenter and mouseleave functions      
      transitionEvents = o.transition.split('-');
      mouseEnter = $.fn.slideReveal.transitions[ transitionEvents[0] ];
      mouseLeave = $.fn.slideReveal.transitions[ transitionEvents[1] ];;
      
      // bind events to the title
      $this.bind('mouseenter.slideReveal', function(){
          mouseEnter( $title, 'enter', o, $children );
      });
      
      $this.bind('mouseleave.slideReveal', function(){
          mouseLeave( $title, 'leave', o, $children );
      });
      
    });
      
  };
      
  $.fn.slideReveal.setAnchor = function( el, anchor ){
    switch( anchor ){
      case 'top':
        el.css({ top : '0', bottom: 'auto', left: 'auto', right : 'auto' });
        break;
      case 'bottom':
        el.css({ top : 'auto', bottom: '0', left: 'auto', right : 'auto' });
        break;
      case 'left':
        el.css({ top : 'auto', bottom: 'auto', left: '0', right : 'auto' });
        break;
      case 'right':
        el.css({ top : 'auto', bottom: 'auto', left: 'auto', right : '0' });
        break;
      default:
        el.css({ top : '0', bottom: 'auto', left: 'auto', right : 'auto' });
    };    
  };
  
  /*
   * this animation function handles both vertical and horizontal transitions
   * ( slideUp, slidDown, slideLeft, slideRight )
   */
  $.fn.slideReveal.animate = function( el, opts, settings, $children ){
     
    el.stop(true); // stop all animation
    
    var width = el.width(),
        height = el.height(),
        parentEl = el.parent(),
        dfd = new jQuery.Deferred(),    
        // get the parent dimentions on each animation enabling the animation to still work if the boxes have been resized
        maxWidth = parentEl.width(),
        maxHeight = parentEl.height(),      
        // the end width or height value is dependent on what event caused this animation ( mouseenter, mouseleave )
        endPosition = settings.mousePosition === 'enter' ? settings.endPosition : settings.startPosition,  
        speed = settings.mousePosition === 'enter' ? opts.hoverSpeed : opts.resetSpeed;
    
    $children.hide();
    
    var animation = {
      
      firstStage: function(){
        clearTimeout( el.timeout ); // clear the timout from the element
        // uses deffered to let the animation know when it's ready to move to secoundStage
        var dfd = new $.Deferred();
        
        var moveToMaximums = function( dimention, maxDimention ){ // move to maximum width and or height
          var properties = {};
          properties[dimention] = maxDimention + 'px';      
          el.animate( properties,  speed, function(){
            // allow for a small delay before going into the final phase for extra finesse
            // this timneout was causing issues
            /*
            to be able to clear the timeout i had to add the timeout as a variable to the element,
            if i just had it as a local variable to this function i could not clear the timeout
            as new versions of this function were being created i think
            */
            el.timeout = setTimeout(function() {
              //need to position the img here ready for animating on the reveal
              //$.fn.slideReveal.setAnchor( o.img, o.startingPosition );
              dfd.resolve( settings.anchor );
            }, opts.maxDelay);
          });                   
        };
    
        if( width < maxWidth ){ // if true we are in a horizontal transition 
          if( settings.dimention == 'width' && el.css( settings.anchor ) === '0px'){
            // already in horizontal mode and anchored to the correct position
            dfd.resolve();
          }else{
            // the box is not acnhored correctly
            moveToMaximums( 'width', maxWidth );        
          }          
        }else if( height < maxHeight ) { // if true we are in a vertical transition  
          if( settings.dimention == 'height' && el.css( settings.anchor ) === '0px' ){
            // already in vertical mode and anchored to the correct position
            dfd.resolve();
          }else{    
            // the box is not acnhored correctly
            moveToMaximums( 'height', maxHeight );
          }          
        }else{ 
          // the width and height match the maximum values so we are free to move
          // straight to the secondStage and apply the correct anchor point
          dfd.resolve( settings.anchor );
        }
        
        return dfd.promise();
        
      }, // firstStage
      
      secondStage: function( anchor, calledBy ){
        
        var properties = {};
        // set this transition as the last transition
        parentEl.data('slideReveal', {
           lastTransition : settings.transitionName
        });             
        // anchor if need be
        if( anchor != undefined ){
          $.fn.slideReveal.setAnchor( el, anchor )
        }
        // final animation
        properties[settings.dimention] = endPosition + 'px';
        el.animate( properties,  speed, function(){
          if( settings.mousePosition === 'enter' ){
            $children.fadeIn( opts.textFade );
          }
        }); 
        
      }, //secondStage
      
    }; //animation
    
    // wait for first stage and when ready move onto the second
    $.when( animation.firstStage() ).then(
        function(status){
            animation.secondStage( status );
        }
    );
        
  }; // END: $.fn.slideReveal.animate()
  
  $.fn.slideReveal.transitions = {
  
    slideUp: function( el, mousePosition, opts, $children ){       
      var settings = {};
      settings.startPosition = opts.startHeight;
      settings.endPosition = opts.endHeight;
      settings.mousePosition = mousePosition;
      settings.anchor = 'top';
      settings.dimention = 'height';
      settings.transitionName = 'slideUp';
      $.fn.slideReveal.animate( el, opts, settings, $children );
    },
    
    slideDown: function( el, mousePosition, opts, $children ){ 
      var settings = {};
      settings.startPosition = opts.startHeight;
      settings.endPosition = opts.endHeight;
      settings.mousePosition = mousePosition;
      settings.anchor = 'bottom';
      settings.dimention = 'height';  
      settings.transitionName = 'slideDown';      
      $.fn.slideReveal.animate( el, opts, settings, $children );
    },
      
    slideLeft: function( el, mousePosition, opts, $children ){
      var settings = {};
      settings.startPosition = opts.startWidth;
      settings.endPosition = opts.endWidth;
      settings.mousePosition = mousePosition;
      settings.anchor = 'left';
      settings.dimention = 'width';
      settings.transitionName = 'slideLeft';
      $.fn.slideReveal.animate( el, opts, settings, $children );
    },
    
    slideRight: function( el, mousePosition, opts, $children ){
      var settings = {};
      settings.startPosition = opts.startWidth;
      settings.endPosition = opts.endWidth;
      settings.mousePosition = mousePosition;
      settings.anchor = 'right';
      settings.dimention = 'width';  
      settings.transitionName = 'slideRight';
      $.fn.slideReveal.animate( el, opts, settings, $children );
    },
    
    random: function( el, mousePosition, opts, $children ){    
      var transitions = [],
          randomnumber = 0,
          data = {},
          lastTransition = '';          
      //retreive last transition
      data = el.parent().data('slideReveal');
      lastTransition = data.lastTransition;
      
      $.each( $.fn.slideReveal.transitions, function(index, value) { 
        if( index != lastTransition && index != 'random' ){ // don't want to repeat a transition twice or load this transition
          transitions.push( value );
        }
      });      

      randomnumber = Math.floor( Math.random() * transitions.length )
      transitions[randomnumber]( el, mousePosition, opts, $children );    
    }
    
  }; // END: $.fn.slideReveal.transitions()
  
  // plugin defaults
  $.fn.slideReveal.defaults = {
    titleClass: 'info',
    bgClass: 'bgimg',
    startWidth: '27',
    endWidth: '50',
    startHeight: '27',
    endHeight: '50',
    transition: 'slideUp-slideDown', // combination of (slideUp, slideDown, slideLeft, slideRight, random) e.g top-bottom
    startingPosition: 'bottom',
    hoverSpeed: 200,
    resetSpeed: 200,
    maxDelay: 90,
    textFade: 100
  };
  
  function log() {
    window.console && console.log && console.log('[slideReveal] ' + Array.prototype.join.call(arguments,' '));
  } 
  
})( jQuery );