#!/bin/bash

for file in $(echo *.csv); do
    gnuplot <<EOF
    set terminal svg
    set output "output_" . substr("${file}", 0, strstrt("${file}", ".csv") - 1) . ".svg"
    set datafile separator ','
    set title "${file} Plot"
    set key autotitle columnheader
	firstrow = system('head -1 ' . "$file")
	set xlabel substr(firstrow, 0, strstrt(firstrow, ",") - 1)
	set ylabel substr(firstrow, strstrt(firstrow, ",") + 1, strlen(firstrow))
    plot "$file" u 1:2 w lines
EOF
done
