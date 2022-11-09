all: test
	rm -rf alert_to_slack.zip
	(cd src && zip -qXr ../alert_to_slack.zip .)

test: requirements
	(cd src && python3 -c "from alert_to_slack import handler" && cd ../)

requirements: requirements.txt.out

requirements.txt.out: requirements.txt
	git clean -qfdx src
	cat requirements.txt
	pip3 install -q -t ./src -r requirements.txt | tee requirements.txt.out

.PHONY: all test requirements
