define(function(require) {
'use strict';
var $ = require('jquery');
var d_parsers = require('./directives_parsers');
var getCachedPVData = require('./getCachedPVData');
var StandartChange = require('./StandartChange');
// var PvSimpleSampler = require('./PvSimpleSampler');
// var patching_directives = d_parsers.patching_directives;
var getIndexList = d_parsers.getIndexList;
var setStrucKey = getCachedPVData.setStrucKey;


var patching_directives = {
  'pv-import': (function(){
    var counter = 1;

    var templateOptions = function(params) {
      this.key = counter++;
      this.samples = params.map[2];
      this.pv_nest = params.pv_nest;
    };

    function getTO(params) {
      if (!params.map[2] || !params.pv_nest) {
        return null;
      }

      return new templateOptions(params);
    }

    return function(node, params, getSample, opts) {
      var template_options = getTO(params);
      var instance = getSample(params.sample_name, true, template_options);

      var parent_node = node.parentNode;
      parent_node.replaceChild(instance, node);

      return instance;
    };
  })(),
  'pv-when': function(node, params, getSample, opts) {
    var parent_node = node.parentNode;
    var full_declaration = params;

    var comment_anchor = window.document.createComment('anchor for pv-when');
    parent_node.replaceChild(comment_anchor, node);
    var directives_data = {
      new_scope_generator: true,
      instructions: {
        'pv-when-condition': makePvWhen(comment_anchor, full_declaration, false, node)
      }
    };
    comment_anchor.directives_data = directives_data;
    return comment_anchor;
  },
  'pv-replace': function(node, params, getSample, opts) {
    params.done = true;
    var map = opts && opts.samples;

    var sample_name = (map && map[params.sample_name]) || params.sample_name;

    var parent_node = node.parentNode;
    if (!params['pv-when']) {
      var tnode = getSample(sample_name, true);
      parent_node.replaceChild(tnode, node);
      return tnode;
    } else {
      var comment_anchor = window.document.createComment('anchor for pv-when');
      parent_node.replaceChild(comment_anchor, node);
      var directives_data = {
        new_scope_generator: true,
        instructions: {
          'pv-when-condition': makePvWhen(comment_anchor, params['pv-when'], function() {
            return getSample(sample_name, true);
          }, null)
        }
      };
      comment_anchor.directives_data = directives_data;
      return comment_anchor;
    }
  }
};

var patching_directives_list = getIndexList(patching_directives);

var patchNode = function(node, struc_store, directives_data, getSample, opts) {
	for (var i = 0; i < patching_directives_list.length; i++) {
		var cur = patching_directives_list[i];
		if (!directives_data || !directives_data.instructions[cur]) {
			continue;
		}
		// cur
		// node, params, getSample, opts
		var result = patching_directives[cur].call(null, node, directives_data.instructions[cur], getSample, opts);
		if (!result) {
			return;
		}

		if (!result.directives_data && !result.pvprsd) {
			throw new Error('should be directives_data');
		}
		if (result.directives_data) {
			setStrucKey(result, struc_store, result.directives_data);
		}
		return result;
	}
};

function makePvWhen(anchor, expression, getSample, sample_node) {
	// debugger;
	return new StandartChange(anchor, {
		data: {
			sample_node: sample_node,
			getSample: getSample
		},
		simplifyValue: function(value) {
			return !!value;
		},
		statement: expression,
		getValue: function(node, data) {
			return node.pvwhen_content;
			// debugger
		},
		setValue: function(node, new_value, old_value, wwtch) {
			if (new_value && !node.pvwhen_content) {
				node.pvwhen_content = true;
				var root_node;
				var tpl  = wwtch.context;
				if (wwtch.data.getSample) {
					root_node = wwtch.data.getSample();
				} else {
					if (!wwtch.data.sampler) {
            var PvSimpleSampler = require('./PvSimpleSampler');
						wwtch.data.sampler = new PvSimpleSampler(wwtch.data.sample_node, tpl.struc_store, tpl.getSample);
					}
					root_node = wwtch.data.sampler.getClone();
				}

				wwtch.root_node = root_node;

				$(node).after(root_node);
				var all_chunks = wwtch.context.parseAppended(root_node);

				wwtch.destroyer = function() {
					node.pvwhen_content = false;
					$(wwtch.root_node).remove();
					for (var i = 0; i < all_chunks.length; i++) {
						all_chunks[i].dead = true;
					}
					wwtch.context.checkChunks();
				};

				wwtch.context.pvTreeChange(this.current_motivator);

				// debugger
			} else if (!new_value && node.pvwhen_content) {
				wwtch.destroyer();
			}
			//	this.setValue(wwtch.node, new_value, old_value, wwtch);

		}
	}, 'pv-when');
}
return patchNode;
});