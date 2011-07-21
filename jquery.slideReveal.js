(function( $ ){

  $.fn.sixMusicBox = function( options ) {
    
    debug(this);
    
    // build main options before element iteration
    var opts = $.extend({}, $.fn.sixMusicBox.defaults, options);
    
    return this.each(function() {

      var $this = $(this);      
      /*
       * support for the meta data plugin is it's being used
       * build element specific options
       */
      var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
      var mouseEnter = function(){};
      var mouseLeave = function(){};
      var transitionEvents = [];
      
      // set the title element and hide the children within it except the first one
      var $title = $this.find('.' + o.titleClass);
      $title.children().css('opacity', 0);
      $title.children(':first-child').css('opacity', 1);
      
      // initialise boxes, setting starting positions and dimentions
      $.fn.sixMusicBox.setAnchor( $title, o.startingPosition );      
      switch( o.startingPosition ){
        case 'top':
          // need to set the last transition up at the beginning to avoid the random
          // transition from choosening a transition which will just move it to to where
          // it currently is already positioned
          $this.data('sixMusicBox', {
             lastTransition : 'slideUp'
          });
          $title.width( $this.width() );
          $title.height( o.startHeight );
          break;
        case 'bottom':
          $this.data('sixMusicBox', {
             lastTransition : 'slideDown'
          });
          $title.width( $this.width() );
          $title.height( o.startHeight );
          break;
        case 'left':
          $this.data('sixMusicBox', {
             lastTransition : 'slideLeft'
          });
          $title.width( o.startWidth );
          $title.height( $this.height() );
          break;
        case 'right':
          $this.data('sixMusicBox', {
             lastTransition : 'slideRight'
          });
          $title.width( o.startWidth );
          $title.height( $this.height() );
          break;
      }
      
      // set the trasnitions up for mouseenter and mouseleave functions      
      transitionEvents = o.transition.split('-');
      mouseEnter = $.fn.sixMusicBox.transitions[ transitionEvents[0] ];
      mouseLeave = $.fn.sixMusicBox.transitions[ transitionEvents[1] ];;
      
      // bind events to the title
      $this.bind('mouseenter', function(){
          mouseEnter( $title, 'enter', o );
      });
      
      $this.bind('mouseleave', function(){
          mouseLeave( $title, 'leave', o );
      });
      
    });
      
  };
      
  $.fn.sixMusicBox.setAnchor = function( el, anchor ){
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
  $.fn.sixMusicBox.animate = function( el, opts, settings ){
     
    el.stop(true); // stop all animation
    var width = el.width();
    var height = el.height();
    var parentEl = el.parent();
    var dfd = new jQuery.Deferred();
    
    /*
     * if we get the parent dimentions on each animation the animations will still work if the boxes have been resized
     */
    var maxWidth = parentEl.width();
    var maxHeight = parentEl.height();
      
    /*
     * mouseenter and mouseleave changes what values are used for the final dimentions
     * mouseenter causes the final dimentions to be the end state and mouseleve the start state
     */
    var endPosition = settings.mousePosition === 'enter' ? settings.endPosition : settings.startPosition;
    
    
    var animation = {
      
      firstStage: function(){
      
        var dfd = new $.Deferred();
        
        var moveToMaximums = function( dimention, maxDimention ){
          // move block to maximum dimentions width and or height
          var properties = {};
          properties[dimention] = maxDimention + 'px';      
          el.animate( properties,  400, function(){
            dfd.resolve( settings.anchor );
          });                   
        };
    
        if( width < maxWidth ){ // if true we are in a horizontal transition      
        
          if( settings.dimention == 'width' && el.css( settings.anchor ) === '0px'){
            // we are already in horizontal mode and anchored to the correct position
            // no need to go to maximum dimentions
            dfd.resolve();
          }else{
            // the box is not acnhored correctly
            // we need to adjust the dimentions to maximum
            moveToMaximums( 'width', maxWidth );        
          }
          
        }else if( height < maxHeight ) { // if true we are in a vertical transition      

          if( settings.dimention == 'height' && el.css( settings.anchor ) === '0px' ){
            dfd.resolve();
          }else{    
            // the box is not acnhored correctly
            // we need to adjust the dimentions to maximum
            moveToMaximums( 'height', maxHeight );
          }
          
        }else{ 
          // the width and height match the maximum values so we are free to move
          // straight to the final phase
          dfd.resolve( settings.anchor );
        }
        
        return dfd.promise();
        
      },
      
      secondStage: function( anchor ){
        // set this transition as the last one fired
        parentEl.data('sixMusicBox', {
           lastTransition : settings.transitionName
        });
             
        // anchor if need be, then complete the final part of the animation
        if( anchor != undefined ){
          $.fn.sixMusicBox.setAnchor( el, anchor )
        }
        var properties = {};
        properties[settings.dimention] = endPosition + 'px';

        el.animate( properties,  400, function(){
          // animation finished
        });
      },
      
    };  

    $.when( animation.firstStage() ).then(
        function(status){
            animation.secondStage( status );
        }
    );
        
  };
  
  $.fn.sixMusicBox.transitions = {
  
    slideUp: function( el, mousePosition, opts ){ 
      
      var settings = {};
      settings.startPosition = opts.startHeight;
      settings.endPosition = opts.endHeight;
      settings.mousePosition = mousePosition;
      settings.anchor = 'top';
      settings.dimention = 'height';
      settings.transitionName = 'slideUp';
      $.fn.sixMusicBox.animate( el, opts, settings );
    },
    
    slideDown: function( el, mousePosition, opts ){ 
      var settings = {}
      settings.startPosition = opts.startHeight;
      settings.endPosition = opts.endHeight;
      settings.mousePosition = mousePosition;
      settings.anchor = 'bottom';
      settings.dimention = 'height';  
      settings.transitionName = 'slideDown';      
      $.fn.sixMusicBox.animate( el, opts, settings );
    },
      
    slideLeft: function( el, mousePosition, opts ){
      var settings = {}
      settings.startPosition = opts.startWidth;
      settings.endPosition = opts.endWidth;
      settings.mousePosition = mousePosition;
      settings.anchor = 'left';
      settings.dimention = 'width';
      settings.transitionName = 'slideLeft';
      $.fn.sixMusicBox.animate( el, opts, settings );
    },
    
    slideRight: function( el, mousePosition, opts ){
      var settings = {}
      settings.startPosition = opts.startWidth;
      settings.endPosition = opts.endWidth;
      settings.mousePosition = mousePosition;
      settings.anchor = 'right';
      settings.dimention = 'width';  
      settings.transitionName = 'slideRight';
      $.fn.sixMusicBox.animate( el, opts, settings );
    },
    
    random: function( el, mousePosition, opts ){
    
      var transitions = [];
      var randomnumber = 0;
      var data = {};
      var lastTransition = '';
      
      data = el.parent().data('sixMusicBox');
      lastTransition = data.lastTransition;
      
      $.each( $.fn.sixMusicBox.transitions, function(index, value) { 
        //log(index + ': ' + value);
        if( index != lastTransition && index != 'random' ){ // don't want to repeat a transition twice
          transitions.push( value );
        }
      });
      
      // log( lastTransition + ' ' + transitions);
      randomnumber = Math.floor( Math.random() * transitions.length )
      transitions[randomnumber]( el, mousePosition, opts );
    
    } // random
    
  }; // $.fn.sixMusicBox.transitions
  
  // plugin defaults
  $.fn.sixMusicBox.defaults = {
    titleClass: 'info',
    startWidth: '27',
    endWidth: '50',
    startHeight: '27',
    endHeight: '50',
    transition: 'slideUp-slideDown', // also allow horizontal,
    startingPosition: 'bottom'
    /*
     * transitions to allow
     * random
     * combination of (slideUp, slideDown, slideLeft, slideRight, random) e.g top-bottom, left-right, top-random
     */
  };
  
  function log() {
    window.console && console.log && console.log('[sixMusicBox] ' + Array.prototype.join.call(arguments,' '));
  }

  function debug($obj) {
    if ( window.console && window.console.log ){
      window.console.log('selection count: ' + $obj.size());
    }
  }  
  
})( jQuery );