/// <reference path="../../_references.ts"/>
/// <reference path="../../models/models.ts"/>
/// <reference path="../../services/dataservice.ts"/>
/// <reference path="../../services/utilityservice.ts"/>

module TalkwallApp {
	"use strict";
	class FeedMessageController {
		static $inject = ['$scope', 'DataService', '$document', 'UtilityService'];

		private message: Message;
		private showControls: boolean = false;
		private originReversed: Array<{}> = new Array();

		constructor(
			private isolatedScope: FeedMessageDirectiveScope,
			public dataService: DataService,
			public $document: ng.IDocumentService,
			private utilityService: UtilityService) {
			this.message = isolatedScope.data;
			if (this.message !== undefined) {
				if (this.message.board === undefined) {
					this.message.board = {};
				}
				this.message.isPinned = false;
				if (this.message.board[this.dataService.getNickname()] !== undefined) {
					this.message.isSelected = true;
					if (this.message.board[this.dataService.getNickname()].pinned === true) {
						this.message.isPinned = false;
					}
				} else {
					this.message.isSelected = false;
				}
			}
		};

		deleteMessage(): void {
			//check if authenticated or author
			if (this.message.creator === this.dataService.getNickname() || this.dataService.userIsAuthorised()) {
				this.message.deleted = true;
				this.persistMessage();
			}
		}

		editMessage(): void {
			if (this.message.creator === this.dataService.getNickname()) {
				this.dataService.setMessageToEdit(this.message);
				this.isolatedScope.showEditPanel();
				this.showControls = false;
			}
		}

		selectMessage(): void {
			this.message.board[this.dataService.getNickname()] = {
				xpos: this.utilityService.getRandomBetween(45, 55) / 100,
				ypos: this.utilityService.getRandomBetween(45, 55) / 100,
				pinned: false
			};
			this.persistMessage();
		}

		unselectMessage(): void {
			delete this.message.board[this.dataService.getNickname()];
			this.message.isPinned = false;
			this.persistMessage();
		}

		pinMessage(): void {
			this.message.board[this.dataService.getNickname()].pinned = true;
			this.persistMessage();
		}

		unpinMessage(): void {
			this.message.board[this.dataService.getNickname()].pinned = false;
			this.persistMessage();
		}

		persistMessage(): void {
			this.dataService.setMessageToEdit(this.message);
			this.dataService.updateMessage();
		}
	}

	function linker(isolatedScope: FeedMessageDirectiveScope , element: ng.IAugmentedJQuery,
	                attributes: ng.IAttributes, ctrl: FeedMessageController) {
		let viewWidthKey = 'VIEW_WIDTH', viewHeightKey = 'VIEW_HEIGHT';
		let changedTouchesKey = 'changedTouches';
		var startX = 0, startY = 0;
		var absStartX = 0, absStartY = 0;
		var diffX = 0, diffY = 0;
		var persistPosition: boolean = false;

		if (isolatedScope.onBoard === 'true') {
			var messageWidth = element.prop('offsetWidth');
			var messageHeight = element.prop('offsetHeight');
			var currentSize = ctrl.dataService.getBoardDivSize();

			element.css({
				top: isolatedScope.data.board[ctrl.dataService.getNickname()].ypos * 100 + '%',
				left: isolatedScope.data.board[ctrl.dataService.getNickname()].xpos * 100 + '%'
			});

			element.on('mousedown touchstart', function(event) {
				// Prevent default dragging of selected content
				event.preventDefault();
				currentSize = ctrl.dataService.getBoardDivSize();
				messageWidth = element.prop('offsetWidth');
				messageHeight = element.prop('offsetHeight');

				if (event instanceof TouchEvent) {
					// Handling the touchstart event
					var touchobj = event[changedTouchesKey][0];
					startX = touchobj.clientX;
					startY = touchobj.clientY;
					absStartX = touchobj.pageX;
					absStartY = touchobj.pageY;
					ctrl.$document.on('touchmove', touchmove);
					ctrl.$document.on('touchend', touchend);
				} else if (event instanceof MouseEvent) {
					// Handling the mousedown event
					absStartX = event.screenX;
					absStartY = event.screenY;
					startX = absStartX - (isolatedScope.data.board[ctrl.dataService.getNickname()].xpos * currentSize[viewWidthKey]);
					startY = absStartY - (isolatedScope.data.board[ctrl.dataService.getNickname()].ypos * currentSize[viewHeightKey]);
					ctrl.$document.on('mousemove', mousemove);
					ctrl.$document.on('mouseup', mouseup);
				}
			});
		}

		function mousemove(event) {
			diffX = event.screenX - absStartX;
			diffY = event.screenY - absStartY;
			//will only persist if move greater than a 5*5px box
			if (diffX >= 5 || diffX <= -5 || diffY >= 5 || diffY <= -5) {
				persistPosition = true;
			}
			isolatedScope.data.board[ctrl.dataService.getNickname()].xpos = event.screenX - startX;
			isolatedScope.data.board[ctrl.dataService.getNickname()].ypos = event.screenY - startY;
			doMove();
		}

		function touchmove(event) {
			var touchobj = event[changedTouchesKey][0];
			diffX = touchobj.pageX - absStartX;
			diffY = touchobj.pageY - absStartY;
			//will only persist if move greater than a 5*5px box
			if (diffX >= 5 || diffX <= -5 || diffY >= 5 || diffY <= -5) {
				persistPosition = true;
			}
			isolatedScope.data.board[ctrl.dataService.getNickname()].xpos = touchobj.pageX - startX;
			isolatedScope.data.board[ctrl.dataService.getNickname()].ypos = touchobj.pageY - startY;
			doMove();
		}

		function doMove() {
			if (isolatedScope.data.board[ctrl.dataService.getNickname()].xpos < 0) {
				isolatedScope.data.board[ctrl.dataService.getNickname()].xpos = 0;
			}

			if (isolatedScope.data.board[ctrl.dataService.getNickname()].xpos > (currentSize[viewWidthKey] - messageWidth)) {
				isolatedScope.data.board[ctrl.dataService.getNickname()].xpos = (currentSize[viewWidthKey] - messageWidth);
			}

			if (isolatedScope.data.board[ctrl.dataService.getNickname()].ypos < 0) {
				isolatedScope.data.board[ctrl.dataService.getNickname()].ypos = 0;
			}

			if (isolatedScope.data.board[ctrl.dataService.getNickname()].ypos > (currentSize[viewHeightKey] - messageHeight)) {
				isolatedScope.data.board[ctrl.dataService.getNickname()].ypos = (currentSize[viewHeightKey] - messageHeight);
			}

			element.css({
				top: isolatedScope.data.board[ctrl.dataService.getNickname()].ypos + 'px',
				left: isolatedScope.data.board[ctrl.dataService.getNickname()].xpos + 'px'
			});

			isolatedScope.data.board[ctrl.dataService.getNickname()].xpos =
				isolatedScope.data.board[ctrl.dataService.getNickname()].xpos / currentSize[viewWidthKey];
			isolatedScope.data.board[ctrl.dataService.getNickname()].ypos =
				isolatedScope.data.board[ctrl.dataService.getNickname()].ypos / currentSize[viewHeightKey];
		}

		function mouseup() {
			ctrl.$document.off('mousemove', mousemove);
			ctrl.$document.off('mouseup', mouseup);
			//only persist if significant move (> 10px)
			//helps not persisting when clicking on controls only
			if (persistPosition) {
				ctrl.persistMessage();
			}
		}

		function touchend() {
			ctrl.$document.off('touchmove', touchmove);
			ctrl.$document.off('touchend', touchend);
			//only persist if significant move (> 10px)
			//helps not persisting when clicking on controls only
			if (persistPosition) {
				ctrl.persistMessage();
			}
		}
	}

	//isolated scope interface
	export interface FeedMessageDirectiveScope extends ng.IScope {
		data: Message;
		showEditPanel(): void;
		onBoard: string;
	}

	//directive declaration
	export function FeedMessage(): ng.IDirective {
		return {
			restrict: 'A',
			scope: {
				data: '=',
				showEditPanel: "&",
				onBoard: "@"
			},
			templateUrl: 'js/components/feedMessage/feedMessage.html',
			controller: FeedMessageController,
			controllerAs: 'feedMessageC',
			link: linker,
			replace: true
		};
	}
}
