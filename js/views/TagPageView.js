define(['pv', './coct', 'spv'], function(pv, coct, spv) {
"use strict";

var TagPageView = spv.inh(coct.PageView, {}, {
	base_tree: {
		sample_name: 'tag_page'
	},
	children_views: {
		// artists_lists: coct.LiListsPreview,
		// songs_list: coct.LiListsPreview,
		albums_list: coct.AlbumsListPreview,
		// similar_tags: coct.TagsListPreview
	}
});


var TagsListPage = spv.inh(coct.PageView, {}, {
	base_tree: {
		sample_name: 'tags_list_page'
	}
});

TagPageView.TagsListPage = TagsListPage;


return TagPageView;
});


