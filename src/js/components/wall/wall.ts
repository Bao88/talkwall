/// <reference path="../../_references.ts"/>
/// <reference path="../../services/urlservice.ts"/>
/// <reference path="../../services/dataservice.ts"/>
/// <reference path="../editMessagePanel/editMessagePanel.ts"/>

module TalkwallApp {
	"use strict";
	import IBottomSheetService = angular.material.IBottomSheetService;
	import ISidenavService = angular.material.ISidenavService;

	export interface IWallControllerService {
		/**
		 * init function for this controller
		 */
		activate(): void;
		/**
		 * Pop up bottom sheet to edit messages. Slide out left sidenav also
		 */
		showMessageEditor(newMessage: boolean): void;
		/**
		 * Toggles which right menu should be open
		 */
		toggleRightMenu(index: number): void;
		/**
		 * Post a new question
		 */
		postNewQuestion(): void;
        /**
         * Get question at index
         * @param index wall.questions Index of the question being selected
         */
        setQuestion(index: number): void;
	}

	export class WallController implements IWallControllerService {
		static $inject = ['DataService', '$mdSidenav', '$mdBottomSheet'];
		private magnified: boolean = false;
		private feedView: boolean = true;
		private rightMenu1: boolean = false;
		private rightMenu2: boolean = false;
		private rightMenu3: boolean = false;
		private newQuestionLabel: string = '';

        private currentWall: Wall;
        private currentQuestion: Question = null;
        private currentQuestionIndex: number = 0;
        private messageToEdit: Message;

        private viewHeight = 700;
        private viewWidth = 1200;

		constructor(
			private dataService: DataService,
			private $mdSidenav: ISidenavService,
			private $mdBottomSheet: IBottomSheetService) {
			console.log('--> WallController: started: ');

			this.dataService.checkAuthentication((success) => {
				this.activate();
			}, null);
		}

		activate(): void {
            this.currentWall = this.dataService.getWall();
            if (this.currentWall.questions.length > 0) {
                this.setQuestion(this.currentQuestionIndex);    // Select first question, no previous question
            }
			if (this.dataService.userIsAuthorised()) {
                this.rightMenu2 = true;
                this.$mdSidenav('right').open();
			}
		}

        setQuestion(questionIndex: number) {
	        this.currentQuestionIndex = questionIndex;
	        this.dataService.setQuestion(this.currentQuestionIndex,
		        (newQuestion) => {
			        //success
	                this.currentQuestion = newQuestion;
		        },
		        function() {
			        //error
		        }
	        );
		}

		showMessageEditor(newMessage): void {
			var handle = this;
			if (newMessage) {
                handle.dataService.setMessageToEdit(new Message());
			}
            this.messageToEdit = handle.dataService.getMessageToEdit();
			this.$mdSidenav('left').open();
			this.$mdBottomSheet.show({
				controller: EditMessageController,
				controllerAs: 'editMessageC',
				templateUrl: 'js/components/editMessagePanel/editMessagePanel.html'
			}).then(function(answer) {
				//dialog answered
				console.log('--> WallController: answer: ' + answer);
				//post message to server and add returned object to question feed
                if (newMessage) {
                    handle.dataService.addMessage(
                        function () {
                            //success
                        },
                        function (error: {}) {
                            //TODO: handle message POST error
                        }
                    );
                } else {
                    handle.dataService.updateMessage( null, null);
                }
			}, function() {
				//dialog dismissed
				console.log('--> WallController: dismissed');
			});
		}

		toggleRightMenu(n: number): void {
			console.log('--> WallController: toggleRightMenu: ' + n);
			switch (n) {
				case 1:
					this.rightMenu1 = !this.rightMenu1;
					this.rightMenu2 = false;
					this.rightMenu3 = false;
					break;
				case 2:
					this.rightMenu1 = false;
					this.rightMenu2 = !this.rightMenu2;
					this.rightMenu3 = false;
					break;
				case 3:
					this.rightMenu1 = false;
					this.rightMenu2 = false;
					this.rightMenu3 = !this.rightMenu3;
					break;
				default:
					this.rightMenu1 = false;
					this.rightMenu2 = false;
					this.rightMenu3 = false;
			}
		}

		postNewQuestion(): void {
			this.dataService.addQuestion(this.newQuestionLabel,
				(success) => {
					this.newQuestionLabel = '';
					//set the current question if none
					if (this.currentQuestion === null) {
						this.setQuestion(this.currentQuestionIndex);
					}
				},
				function(error) {
					//TODO: handle question retrieval error
				}
			);
		}
	}
}
