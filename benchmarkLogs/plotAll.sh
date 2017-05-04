#!/bin/bash

for file in $(echo *.csv); do
    gnuplot <<EOF
    set terminal pdf
    set output "output_${file}.pdf"
    set datafile separator ','
    set title "${file} Plot"
    set key autotitle columnheader
	#firstrow = system('head -1 ' . ${file})
	#set xlabel word(firstrow, 1)
	#set ylabel word(firstrow, 2)
    plot "$file" u 1:2 w lines
EOF
done
