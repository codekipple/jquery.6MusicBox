(function( $ ){

  $.fn.slideReveal = function( options ) {
    
    // build main options before element iteration
    var opts = $.extend({}, $.fn.slideReveal.defaults, options);
    
    return this.each(function() {

      var $this = $(this);      
      // support for the meta data plugin fs it's being used build element specific options
      var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
      var mouseEnter = function(){};
      var mouseLeave = function(){};
      var transitionEvents = [];
      
      // set the title element and hide the children within it except the first one
      var $title = $this.find('.' + o.titleClass);
      $title.children().css('opacity', 0);
      $title.children(':first-child').css('opacity', 1);
      
      // initialise boxes, setting anchor and dimentions
      $.fn.slideReveal.setAnchor( $title, o.startingPosition );      
      switch( o.startingPosition ){
        case 'top':
          // need to set the last transition up at the beginning to avoid the random
          // transition from choosening a transition which will just move it to to where
          // it's currently already positioned
          $this.data('slideReveal', {
             lastTransition : 'slideUp'
          });
          $title.width( $this.width() );
          $title.height( o.startHeight );
          break;
        case 'bottom':
          $this.data('slideReveal', {
             lastTransition : 'slideDown'
          });
          $title.width( $this.width() );
          $title.height( o.startHeight );
          break;
        case 'left':
          $this.data('slideReveal', {
             lastTransition : 'slideLeft'
          });
          $title.width( o.startWidth );
          $title.height( $this.height() );
          break;
        case 'right':
          $this.data('slideReveal', {
             lastTransition : 'slideRight'
          });
          $title.width( o.startWidth );
          $title.height( $this.height() );
          break;
      }
      
      // set the trasnitions up for mouseenter and mouseleave functions      
      transitionEvents = o.transition.split('-');
      mouseEnter = $.fn.slideReveal.transitions[ transitionEvents[0] ];
      mouseLeave = $.fn.slideReveal.transitions[ transitionEvents[1] ];;
      
      // bind events to the title
      $this.bind('mouseenter', function(){
          mouseEnter( $title, 'enter', o );
      });
      
      $this.bind('mouseleave', function(){
          mouseLeave( $title, 'leave', o );
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
   * this animation function handles both vertical and horizontal transitions as well as the random one
   * ( slideUp, slidDown, slideLeft, slideRight, random )
   */
  $.fn.slideReveal.animate = function( el, opts, settings ){
     
    el.stop(true); // stop all animation
    var width = el.width();
    var height = el.height();
    var parentEl = el.parent();
    var dfd = new jQuery.Deferred();    
    // get the parent dimentions on each animation enabling the animation to still work if the boxes have been resized
    var maxWidth = parentEl.width();
    var maxHeight = parentEl.height();      
    // the end width or height value is dependent on what event caused this animation ( mouseenter, mouseleave )
    var endPosition = settings.mousePosition === 'enter' ? settings.endPosition : settings.startPosition;    
    
    var animation = {
      
      firstStage: function(){
        // uses deffered to let the animation know when it's ready to move to secoundStage
        var dfd = new $.Deferred();
        
        var moveToMaximums = function( dimention, maxDimention ){ // move to maximum width and or height
          var properties = {};
          properties[dimention] = maxDimention + 'px';      
          el.animate( properties,  400, function(){
            dfd.resolve( settings.anchor );
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
        
      },
      
      secondStage: function( anchor ){
        // set this transition as the last transition
        parentEl.data('slideReveal', {
           lastTransition : settings.transitionName
        });             
        // anchor if need be
        if( anchor != undefined ){
          $.fn.slideReveal.setAnchor( el, anchor )
        }
        // final animation
        var properties = {};
        properties[settings.dimention] = endPosition + 'px';
        el.animate( properties,  400, function(){
          // animation finished
        });        
      },
      
    };  
    
    // wait for first stage and when ready move onto the second
    $.when( animation.firstStage() ).then(
        function(status){
            animation.secondStage( status );
        }
    );
        
  }; // END: $.fn.slideReveal.animate()
  
  $.fn.slideReveal.transitions = {
  
    slideUp: function( el, mousePosition, opts ){       
      var settings = {};
      settings.startPosition = opts.startHeight;
      settings.endPosition = opts.endHeight;
      settings.mousePosition = mousePosition;
      settings.anchor = 'top';
      settings.dimention = 'height';
      settings.transitionName = 'slideUp';
      $.fn.slideReveal.animate( el, opts, settings );
    },
    
    slideDown: function( el, mousePosition, opts ){ 
      var settings = {}
      settings.startPosition = opts.startHeight;
      settings.endPosition = opts.endHeight;
      settings.mousePosition = mousePosition;
      settings.anchor = 'bottom';
      settings.dimention = 'height';  
      settings.transitionName = 'slideDown';      
      $.fn.slideReveal.animate( el, opts, settings );
    },
      
    slideLeft: function( el, mousePosition, opts ){
      var settings = {}
      settings.startPosition = opts.startWidth;
      settings.endPosition = opts.endWidth;
      settings.mousePosition = mousePosition;
      settings.anchor = 'left';
      settings.dimention = 'width';
      settings.transitionName = 'slideLeft';
      $.fn.slideReveal.animate( el, opts, settings );
    },
    
    slideRight: function( el, mousePosition, opts ){
      var settings = {}
      settings.startPosition = opts.startWidth;
      settings.endPosition = opts.endWidth;
      settings.mousePosition = mousePosition;
      settings.anchor = 'right';
      settings.dimention = 'width';  
      settings.transitionName = 'slideRight';
      $.fn.slideReveal.animate( el, opts, settings );
    },
    
    random: function( el, mousePosition, opts ){    
      var transitions = [];
      var randomnumber = 0;
      var data = {};
      var lastTransition = '';
      //retreive last transition
      data = el.parent().data('slideReveal');
      lastTransition = data.lastTransition;
      
      $.each( $.fn.slideReveal.transitions, function(index, value) { 
        if( index != lastTransition && index != 'random' ){ // don't want to repeat a transition twice or load this transition
          transitions.push( value );
        }
      });      

      randomnumber = Math.floor( Math.random() * transitions.length )
      transitions[randomnumber]( el, mousePosition, opts );    
    }
    
  }; // END: $.fn.slideReveal.transitions()
  
  // plugin defaults
  $.fn.slideReveal.defaults = {
    titleClass: 'info',
    startWidth: '27',
    endWidth: '50',
    startHeight: '27',
    endHeight: '50',
    transition: 'slideUp-slideDown', // combination of (slideUp, slideDown, slideLeft, slideRight, random) e.g top-bottom
    startingPosition: 'bottom'
  };
  
  function log() {
    window.console && console.log && console.log('[slideReveal] ' + Array.prototype.join.call(arguments,' '));
  } 
  
})( jQuery );